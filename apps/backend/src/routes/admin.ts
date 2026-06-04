import type { FastifyInstance } from "fastify";
import { ReportStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "../lib/auth.js";
import { hashPassword } from "../lib/crypto.js";
import { fail } from "../lib/errors.js";
import { isOwnerRole, isRoleBadgeSlug, syncRoleBadgeForUser, syncRoleBadgeForUserId } from "../lib/role-badges.js";
import { serializeAsset } from "../lib/serialize.js";
import { usernameSchema } from "../lib/username.js";
import { passwordSchema } from "../lib/validators.js";

const userPatchSchema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().max(300).nullable().optional(),
  role: z.nativeEnum(UserRole).optional(),
  newPassword: passwordSchema.optional()
});

const globalBadgeSchema = z.object({
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(32),
  description: z.string().trim().max(200).default(""),
  tooltip: z.string().trim().max(120).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#d4d4d4"),
  glowColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ffffff"),
  iconFileId: z.string().cuid().nullable().optional()
});

const assignBadgeSchema = z.object({
  profileId: z.string().cuid(),
  badgeId: z.string().cuid()
});

const reportPatchSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  resolution: z.string().trim().max(1000).optional()
});

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(1000),
  tone: z.enum(["info", "success", "warning", "danger"]).default("info"),
  isActive: z.boolean().default(true),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional()
});

const templateAdminPatchSchema = z.object({
  isPublished: z.boolean().optional(),
  style: z.string().trim().min(1).max(40).optional(),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).optional()
});

const resetViewsSchema = z.object({
  mode: z.enum(["zero", "recalculate"]).default("zero")
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/api/admin")) {
      requireRole(request, ["ADMIN"]);
    }
  });

  app.get("/api/admin/stats", async () => {
    const [users, profiles, templates, openReports, files, views] = await Promise.all([
      app.prisma.user.count(),
      app.prisma.profile.count(),
      app.prisma.template.count(),
      app.prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
      app.prisma.fileAsset.count({ where: { deletedAt: null } }),
      app.prisma.profileView.count()
    ]);
    return { users, profiles, templates, openReports, files, views };
  });

  app.get("/api/admin/users", async (request) => {
    requireRole(request, ["ADMIN", "MODERATOR"]);
    let users = await findAdminUsers(app);
    await Promise.all(users.map((user) => syncRoleBadgeForUser({
      prisma: app.prisma,
      userId: user.id,
      profileId: user.profile?.id ?? null,
      role: user.role,
      assignedById: user.id
    })));
    users = await findAdminUsers(app);
    return {
      users: users.map((user) => {
        if (!user.profile) return user;
        const fileById = new Map(user.profile.files.map((file) => [file.id, file]));
        const { files: _files, ...profile } = user.profile;
        return {
          ...user,
          profile: {
            ...profile,
            assets: {
              avatar: serializeAsset(request, profile.avatarFileId ? fileById.get(profile.avatarFileId) : null)
            }
          }
        };
      })
    };
  });

  app.get("/api/admin/badges", async () => {
    const badges = await app.prisma.badge.findMany({
      include: {
        _count: { select: { userBadges: true } }
      },
      orderBy: [{ isGlobal: "desc" }, { name: "asc" }]
    });
    return {
      badges: badges.map((badge) => ({
        id: badge.id,
        slug: badge.slug,
        name: badge.name,
        description: badge.description,
        tooltip: badge.tooltip,
        color: badge.color,
        glowColor: badge.glowColor,
        iconFileId: badge.iconFileId,
        isGlobal: badge.isGlobal,
        assignmentCount: badge._count.userBadges,
        createdAt: badge.createdAt,
        updatedAt: badge.updatedAt
      }))
    };
  });

  app.patch("/api/admin/users/:id", async (request) => {
    const actor = requireRole(request, ["ADMIN"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = userPatchSchema.parse(request.body);
    if (body.role === "OWNER") {
      fail(403, "OWNER_ROLE_PROTECTED", "Owner rank can only be assigned with a direct database command");
    }
    const target = await app.prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true }
    });
    if (!target) fail(404, "USER_NOT_FOUND", "User was not found");
    assertUserIsNotOwner(target.role);
    const updated = await app.prisma.user.update({
      where: { id: params.id },
      data: {
        ...(body.isBanned !== undefined ? { isBanned: body.isBanned } : {}),
        ...(body.banReason !== undefined ? { banReason: body.banReason } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.newPassword !== undefined ? { passwordHash: await hashPassword(body.newPassword) } : {})
      }
    });
    await syncRoleBadgeForUserId({ prisma: app.prisma, userId: updated.id, assignedById: actor.id });
    const auditBody = { ...body, ...(body.newPassword ? { newPassword: "[redacted]" } : {}) };
    await audit(app, actor.id, "user.update", "USER", params.id, auditBody);
    return { user: updated };
  });

  app.post("/api/admin/badges", async (request) => {
    const actor = requireRole(request, ["ADMIN"]);
    const body = globalBadgeSchema.parse(request.body);
    assertBadgeIsNotProtected(body.slug);
    const badge = await app.prisma.badge.upsert({
      where: { slug: body.slug },
      create: {
        slug: body.slug,
        name: body.name,
        description: body.description,
        tooltip: body.tooltip,
        color: body.color,
        glowColor: body.glowColor,
        iconFileId: body.iconFileId ?? null,
        isGlobal: true
      },
      update: {
        name: body.name,
        description: body.description,
        tooltip: body.tooltip,
        color: body.color,
        glowColor: body.glowColor,
        iconFileId: body.iconFileId ?? null,
        isGlobal: true
      }
    });
    await audit(app, actor.id, "badge.upsert", "BADGE", badge.id, body);
    return { badge };
  });

  app.post("/api/admin/badges/assign", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const body = assignBadgeSchema.parse(request.body);
    const [profile, badge] = await Promise.all([
      app.prisma.profile.findUnique({
        where: { id: body.profileId },
        include: { user: { select: { role: true } } }
      }),
      app.prisma.badge.findUnique({ where: { id: body.badgeId } })
    ]);
    if (!profile || !badge) fail(404, "NOT_FOUND", "Profile or badge was not found");
    assertUserIsNotOwner(profile.user.role);
    assertBadgeIsNotProtected(badge.slug);
    const userBadge = await app.prisma.userBadge.upsert({
      where: { profileId_badgeId: { profileId: profile.id, badgeId: badge.id } },
      create: { profileId: profile.id, badgeId: badge.id, assignedById: actor.id },
      update: { assignedById: actor.id }
    });
    await audit(app, actor.id, "badge.assign", "PROFILE", profile.id, body);
    return { userBadge };
  });

  app.delete("/api/admin/profiles/:profileId/badges/:badgeId", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = z.object({ profileId: z.string().cuid(), badgeId: z.string().cuid() }).parse(request.params);
    const [profile, badge] = await Promise.all([
      app.prisma.profile.findUnique({
        where: { id: params.profileId },
        include: { user: { select: { role: true } } }
      }),
      app.prisma.badge.findUnique({
        where: { id: params.badgeId },
        select: { slug: true }
      })
    ]);
    if (!profile) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    if (!badge) fail(404, "BADGE_NOT_FOUND", "Badge was not found");
    assertUserIsNotOwner(profile.user.role);
    assertBadgeIsNotProtected(badge.slug);
    await app.prisma.userBadge.deleteMany({
      where: {
        profileId: params.profileId,
        badgeId: params.badgeId
      }
    });
    await audit(app, actor.id, "badge.remove", "PROFILE", params.profileId, { badgeId: params.badgeId });
    return { ok: true };
  });

  app.get("/api/admin/reports", async () => {
    const reports = await app.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        reporter: { select: { username: true } },
        reviewer: { select: { username: true } }
      }
    });
    return { reports };
  });

  app.patch("/api/admin/reports/:id", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = reportPatchSchema.parse(request.body);
    const data: { status: ReportStatus; reviewerUserId: string; resolution?: string } = {
      status: body.status,
      reviewerUserId: actor.id
    };
    if (body.resolution !== undefined) data.resolution = body.resolution;
    const report = await app.prisma.report.update({
      where: { id: params.id },
      data
    });
    await audit(app, actor.id, "report.update", "REPORT", params.id, body);
    return { report };
  });

  app.post("/api/admin/reserved-usernames", async (request) => {
    const actor = requireRole(request, ["ADMIN"]);
    const body = z.object({ name: usernameSchema, reason: z.string().max(120).default("reserved") }).parse(request.body);
    const reserved = await app.prisma.reservedUsername.upsert({
      where: { normalized: body.name },
      create: { name: body.name, normalized: body.name, reason: body.reason, createdById: actor.id },
      update: { reason: body.reason, createdById: actor.id }
    });
    await audit(app, actor.id, "reservedUsername.upsert", "RESERVED_USERNAME", reserved.id, body);
    return { reserved };
  });

  app.post("/api/admin/announcements", async (request) => {
    const actor = requireRole(request, ["ADMIN"]);
    const body = announcementSchema.parse(request.body);
    const announcement = await app.prisma.announcement.create({
      data: {
        title: body.title,
        body: body.body,
        tone: body.tone,
        isActive: body.isActive,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        createdById: actor.id
      }
    });
    await audit(app, actor.id, "announcement.create", "ANNOUNCEMENT", announcement.id, body);
    return { announcement };
  });

  app.delete("/api/admin/files/:id", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const existing = await app.prisma.fileAsset.findUnique({
      where: { id: params.id },
      include: { owner: { select: { role: true } } }
    });
    if (!existing) fail(404, "FILE_NOT_FOUND", "File was not found");
    assertUserIsNotOwner(existing.owner.role);
    const file = await app.prisma.fileAsset.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isPublic: false }
    });
    await audit(app, actor.id, "file.remove", "FILE", file.id, { objectKey: file.objectKey });
    return { file };
  });

  app.delete("/api/admin/profiles/:id", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const profile = await app.prisma.profile.findUnique({
      where: { id: params.id },
      include: { user: { select: { role: true } } }
    });
    if (!profile) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    assertUserIsNotOwner(profile.user.role);
    await app.prisma.$transaction([
      app.prisma.link.deleteMany({ where: { profileId: profile.id } }),
      app.prisma.userBadge.deleteMany({ where: { profileId: profile.id } }),
      app.prisma.profile.update({
        where: { id: profile.id },
        data: {
          isPublic: false,
          displayName: "Removed profile",
          bio: "",
          location: "",
          statusText: "",
          customCss: "",
          sanitizedCss: "",
          embeds: []
        }
      })
    ]);
    await audit(app, actor.id, "profile.remove", "PROFILE", profile.id, {});
    return { ok: true };
  });

  app.post("/api/admin/profiles/:id/views/reset", async (request) => {
    const actor = requireRole(request, ["ADMIN"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = resetViewsSchema.parse(request.body ?? {});
    const profile = await app.prisma.profile.findUnique({
      where: { id: params.id },
      include: { user: { select: { username: true, role: true } } }
    });
    if (!profile) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    assertUserIsNotOwner(profile.user.role);

    if (body.mode === "recalculate") {
      const uniqueViews = await app.prisma.profileView.count({ where: { profileId: profile.id } });
      const updated = await app.prisma.profile.update({
        where: { id: profile.id },
        data: { viewCount: uniqueViews },
        select: { id: true, viewCount: true }
      });
      await audit(app, actor.id, "profile.views.recalculate", "PROFILE", profile.id, { viewCount: uniqueViews });
      app.io.to(`profile:${profile.user.username}`).emit("profile:view", {
        username: profile.user.username,
        viewCount: updated.viewCount
      });
      return { ok: true, profileId: updated.id, viewCount: updated.viewCount };
    }

    const [updated] = await app.prisma.$transaction([
      app.prisma.profile.update({
        where: { id: profile.id },
        data: { viewCount: 0 },
        select: { id: true, viewCount: true }
      }),
      app.prisma.profileView.deleteMany({ where: { profileId: profile.id } }),
      app.prisma.analyticsEvent.deleteMany({ where: { profileId: profile.id, type: "PROFILE_VIEW" } })
    ]);
    await audit(app, actor.id, "profile.views.reset", "PROFILE", profile.id, {});
    app.io.to(`profile:${profile.user.username}`).emit("profile:view", {
      username: profile.user.username,
      viewCount: updated.viewCount
    });
    return { ok: true, profileId: updated.id, viewCount: updated.viewCount };
  });

  app.patch("/api/admin/templates/:id", async (request) => {
    const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = templateAdminPatchSchema.parse(request.body);
    const existing = await app.prisma.template.findUnique({
      where: { id: params.id },
      include: { owner: { select: { role: true } } }
    });
    if (!existing) fail(404, "TEMPLATE_NOT_FOUND", "Template was not found");
    assertUserIsNotOwner(existing.owner.role);
    const template = await app.prisma.template.update({
      where: { id: params.id },
      data: {
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(body.style !== undefined ? { style: body.style } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {})
      }
    });
    await audit(app, actor.id, "template.manage", "TEMPLATE", template.id, body);
    return { template };
  });
}

async function findAdminUsers(app: FastifyInstance) {
  return app.prisma.user.findMany({
    include: {
      profile: {
        select: {
          id: true,
          uid: true,
          displayName: true,
          viewCount: true,
          isPublic: true,
          avatarFileId: true,
          files: {
            where: { deletedAt: null, kind: "AVATAR" }
          },
          badges: {
            orderBy: { order: "asc" },
            include: {
              badge: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                  color: true,
                  glowColor: true,
                  tooltip: true,
                  isGlobal: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
}

function assertUserIsNotOwner(role: UserRole): void {
  if (isOwnerRole(role)) {
    fail(403, "OWNER_PROTECTED", "Owner accounts are protected and can only be changed with direct database access");
  }
}

function assertBadgeIsNotProtected(slug: string): void {
  if (isRoleBadgeSlug(slug)) {
    fail(403, "BADGE_PROTECTED", "Role badges are managed by the system and cannot be changed from the admin panel");
  }
}

async function audit(
  app: FastifyInstance,
  actorUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: unknown
): Promise<void> {
  await app.prisma.adminAuditLog.create({
    data: { actorUserId, action, targetType, targetId, metadata: metadata as object }
  });
}
