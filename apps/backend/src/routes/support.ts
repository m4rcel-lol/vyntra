import type { FastifyInstance, FastifyRequest } from "fastify";
import { Prisma, type FileAsset, type SupportConversationStatus, type UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRole, requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
import { createNotification } from "../lib/notifications.js";
import { serializeAsset } from "../lib/serialize.js";

const createSupportSchema = z.object({
  subject: z.string().trim().min(3).max(120).default("Support request"),
  message: z.string().trim().min(5).max(3000)
});

const supportMessageSchema = z.object({
  body: z.string().trim().min(1).max(3000)
});

const conversationParams = z.object({ id: z.string().cuid() });

type SupportUserPayload = {
  id: string;
  username: string;
  role: UserRole;
  profile: {
    id: string;
    displayName: string;
    avatarFileId: string | null;
    files: FileAsset[];
  } | null;
};

const supportUserInclude = {
  profile: {
    select: {
      id: true,
      displayName: true,
      avatarFileId: true,
      files: { where: { deletedAt: null, kind: "AVATAR" as const } }
    }
  }
};

export async function registerSupportRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/support/conversations/me", async (request) => {
    const user = requireUser(request);
    const conversations = await app.prisma.supportConversation.findMany({
      where: { requesterUserId: user.id },
      include: supportConversationInclude,
      orderBy: { updatedAt: "desc" },
      take: 50
    });
    return { conversations: conversations.map((conversation) => serializeSupportConversation(request, conversation)) };
  });

  app.post("/api/support/conversations", async (request) => {
    const user = requireUser(request);
    const body = createSupportSchema.parse(request.body);
    const conversation = await app.prisma.supportConversation.create({
      data: {
        requesterUserId: user.id,
        subject: body.subject,
        status: "BOT",
        messages: {
          create: [
            {
              authorRole: "BOT",
              body: botIntro(body.subject)
            },
            {
              authorUserId: user.id,
              authorRole: "USER",
              body: body.message
            },
            {
              authorRole: "BOT",
              body: botTips(body.message)
            }
          ]
        }
      },
      include: supportConversationInclude
    });
    return { conversation: serializeSupportConversation(request, conversation) };
  });

  app.get("/api/support/conversations/:id", async (request) => {
    const user = requireUser(request);
    const params = conversationParams.parse(request.params);
    const conversation = await app.prisma.supportConversation.findUnique({
      where: { id: params.id },
      include: supportConversationInclude
    });
    if (!conversation) fail(404, "SUPPORT_CONVERSATION_NOT_FOUND", "Support conversation was not found");
    assertConversationAccess(conversation, user.id, user.role);
    return { conversation: serializeSupportConversation(request, conversation) };
  });

  app.post("/api/support/conversations/:id/messages", async (request) => {
    const user = requireUser(request);
    const params = conversationParams.parse(request.params);
    const body = supportMessageSchema.parse(request.body);
    const conversation = await app.prisma.supportConversation.findUnique({ where: { id: params.id } });
    if (!conversation) fail(404, "SUPPORT_CONVERSATION_NOT_FOUND", "Support conversation was not found");
    assertConversationAccess(conversation, user.id, user.role);
    if (conversation.status === "CLOSED") fail(400, "SUPPORT_CLOSED", "This support conversation is closed");
    const staff = isStaffRole(user.role);
    if (conversation.status === "WAITING_FOR_STAFF" && !staff) {
      fail(423, "SUPPORT_WAITING_FOR_STAFF", "This chat is waiting for a staff representative");
    }
    if (conversation.status === "BOT" && wantsStaff(body.body)) {
      const updated = await escalateConversation(app, conversation.id, user.id);
      return { conversation: serializeSupportConversation(request, updated) };
    }
    if (conversation.status === "ACTIVE" && staff && conversation.assignedStaffId && conversation.assignedStaffId !== user.id && user.role !== "OWNER") {
      fail(403, "SUPPORT_ASSIGNED_TO_OTHER_STAFF", "This support conversation is assigned to another staff member");
    }

    const [message, updatedConversation] = await app.prisma.$transaction([
      app.prisma.supportMessage.create({
        data: {
          conversationId: conversation.id,
          authorUserId: user.id,
          authorRole: staff ? "STAFF" : "USER",
          body: body.body
        },
        include: { author: { include: supportUserInclude } }
      }),
      app.prisma.supportConversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
        include: supportConversationInclude
      })
    ]);

    app.io.to(`support:${conversation.id}`).emit("support:message", serializeSupportMessage(request, message));
    if (staff) {
      await createNotification(app, {
        userId: conversation.requesterUserId,
        type: "support.reply",
        title: "Staff replied to your support chat",
        body: body.body.slice(0, 140),
        url: "/dashboard/support"
      });
    } else if (conversation.assignedStaffId) {
      await createNotification(app, {
        userId: conversation.assignedStaffId,
        type: "support.user_reply",
        title: `${user.username} replied in support`,
        body: body.body.slice(0, 140),
        url: "/admin"
      });
    }
    return { conversation: serializeSupportConversation(request, updatedConversation) };
  });

  app.post("/api/support/conversations/:id/escalate", async (request) => {
    const user = requireUser(request);
    const params = conversationParams.parse(request.params);
    const conversation = await app.prisma.supportConversation.findUnique({ where: { id: params.id } });
    if (!conversation) fail(404, "SUPPORT_CONVERSATION_NOT_FOUND", "Support conversation was not found");
    assertConversationAccess(conversation, user.id, user.role);
    if (conversation.status === "CLOSED") fail(400, "SUPPORT_CLOSED", "This support conversation is closed");
    const updated = await escalateConversation(app, conversation.id, user.id);
    return { conversation: serializeSupportConversation(request, updated) };
  });

  app.post("/api/support/conversations/:id/accept", async (request) => {
    const staff = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = conversationParams.parse(request.params);
    const conversation = await app.prisma.supportConversation.findUnique({ where: { id: params.id } });
    if (!conversation) fail(404, "SUPPORT_CONVERSATION_NOT_FOUND", "Support conversation was not found");
    if (conversation.status === "CLOSED") fail(400, "SUPPORT_CLOSED", "This support conversation is closed");

    const updated = await app.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: {
        assignedStaffId: staff.id,
        status: "ACTIVE",
        messages: {
          create: {
            authorUserId: staff.id,
            authorRole: "STAFF",
            body: `${staff.username} joined the chat. You can continue here now.`
          }
        }
      },
      include: supportConversationInclude
    });
    await createNotification(app, {
      userId: conversation.requesterUserId,
      type: "support.accepted",
      title: "A staff representative joined your support chat",
      url: "/dashboard/support"
    });
    app.io.to(`support:${conversation.id}`).emit("support:accepted", { conversationId: conversation.id, staffId: staff.id });
    return { conversation: serializeSupportConversation(request, updated) };
  });

  app.post("/api/support/conversations/:id/close", async (request) => {
    const user = requireUser(request);
    const params = conversationParams.parse(request.params);
    const conversation = await app.prisma.supportConversation.findUnique({ where: { id: params.id } });
    if (!conversation) fail(404, "SUPPORT_CONVERSATION_NOT_FOUND", "Support conversation was not found");
    assertConversationAccess(conversation, user.id, user.role);
    if (conversation.requesterUserId !== user.id && !isStaffRole(user.role)) {
      fail(403, "FORBIDDEN", "You cannot close this support conversation");
    }
    const updated = await app.prisma.supportConversation.update({
      where: { id: conversation.id },
      data: { status: "CLOSED", closedAt: new Date() },
      include: supportConversationInclude
    });
    app.io.to(`support:${conversation.id}`).emit("support:closed", { conversationId: conversation.id });
    return { conversation: serializeSupportConversation(request, updated) };
  });

  app.get("/api/admin/support/conversations", async (request) => {
    requireRole(request, ["ADMIN", "MODERATOR"]);
    const conversations = await app.prisma.supportConversation.findMany({
      include: supportConversationInclude,
      orderBy: [
        { status: "asc" },
        { updatedAt: "desc" }
      ],
      take: 100
    });
    return { conversations: conversations.map((conversation) => serializeSupportConversation(request, conversation)) };
  });
}

const supportConversationInclude = {
  requester: { include: supportUserInclude },
  assignedStaff: { include: supportUserInclude },
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { include: supportUserInclude } },
    take: 250
  }
};

async function escalateConversation(app: FastifyInstance, conversationId: string, requesterUserId: string) {
  const updated = await app.prisma.supportConversation.update({
    where: { id: conversationId },
    data: {
      status: "WAITING_FOR_STAFF",
      messages: {
        create: {
          authorRole: "BOT",
          body: "I marked this for staff review. The chat is now locked until a staff representative accepts it."
        }
      }
    },
    include: supportConversationInclude
  });
  await createNotification(app, {
    userId: requesterUserId,
    type: "support.waiting",
    title: "Support request sent to staff",
    body: "A staff representative can now accept and join the chat.",
    url: "/dashboard/support"
  });
  await notifyStaffQueue(app, conversationId);
  app.io.to("admin").emit("support:waiting", { conversationId });
  return updated;
}

async function notifyStaffQueue(app: FastifyInstance, conversationId: string): Promise<void> {
  const staff = await app.prisma.user.findMany({
    where: { isBanned: false, role: { in: ["OWNER", "ADMIN", "MODERATOR"] } },
    select: { id: true }
  });
  await Promise.all(staff.map((user) =>
    createNotification(app, {
      userId: user.id,
      type: "support.waiting",
      title: "New support chat waiting",
      body: "A user asked to speak with staff.",
      url: "/admin"
    })
  ));
  app.io.to("admin").emit("support:queue", { conversationId });
}

function botIntro(subject: string): string {
  return `Hi. I am Vyntra Assist. I will collect the issue first: ${subject}. If this is about uploads, try a smaller file, refresh the editor, and save again. If this is about login, check your domain and cookie settings.`;
}

function botTips(message: string): string {
  const value = message.toLowerCase();
  if (value.includes("upload") || value.includes("image") || value.includes("music")) {
    return "Quick upload checks: use a supported file type, keep files below the configured upload limit, and wait for the upload success toast before saving the profile.";
  }
  if (value.includes("login") || value.includes("register") || value.includes("cookie")) {
    return "Quick auth checks: make sure PUBLIC_APP_URL and FRONTEND_ORIGIN match the domain you are using, and access the site from one hostname consistently.";
  }
  if (value.includes("docker") || value.includes("server") || value.includes("deploy")) {
    return "Quick deploy checks: run migrations, confirm backend health is green, and keep DATABASE_URL pointed at the compose postgres host inside Docker.";
  }
  return "Quick tip: include what page you were on, what button you clicked, and the exact error text. Type 'staff' or use the staff button if you need a representative.";
}

function wantsStaff(body: string): boolean {
  return /\b(staff|human|representative|admin|moderator|person)\b/i.test(body);
}

function assertConversationAccess(
  conversation: { requesterUserId: string; assignedStaffId: string | null },
  userId: string,
  role: UserRole
): void {
  if (conversation.requesterUserId === userId || conversation.assignedStaffId === userId || isStaffRole(role)) return;
  fail(403, "FORBIDDEN", "You cannot access this support conversation");
}

function serializeSupportConversation(
  request: FastifyRequest,
  conversation: Prisma.SupportConversationGetPayload<{ include: typeof supportConversationInclude }>
) {
  return {
    id: conversation.id,
    subject: conversation.subject,
    status: conversation.status as SupportConversationStatus,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    closedAt: conversation.closedAt,
    requester: serializeSupportUser(request, conversation.requester),
    assignedStaff: conversation.assignedStaff ? serializeSupportUser(request, conversation.assignedStaff) : null,
    messages: conversation.messages.map((message) => serializeSupportMessage(request, message))
  };
}

function serializeSupportMessage(
  request: FastifyRequest,
  message: Prisma.SupportMessageGetPayload<{ include: { author: { include: typeof supportUserInclude } } }>
) {
  return {
    id: message.id,
    authorRole: message.authorRole,
    body: message.body,
    createdAt: message.createdAt,
    author: message.author ? serializeSupportUser(request, message.author) : null
  };
}

function serializeSupportUser(request: FastifyRequest, user: SupportUserPayload) {
  const avatarFile = user.profile?.files.find((file) => file.id === user.profile?.avatarFileId) ?? null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.profile?.displayName || user.username,
    avatar: serializeAsset(request, avatarFile)
  };
}

function isStaffRole(role: UserRole): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MODERATOR";
}
