import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
import { createNotification } from "../lib/notifications.js";
import { serializeAsset } from "../lib/serialize.js";
const usernameParams = z.object({ username: z.string().trim().min(1).max(40) });
const conversationParams = z.object({ id: z.string().cuid() });
const messageBody = z.object({ body: z.string().trim().min(1).max(2000) });
const publicUserInclude = {
    profile: {
        select: {
            id: true,
            uid: true,
            displayName: true,
            avatarFileId: true,
            files: { where: { deletedAt: null, kind: "AVATAR" } }
        }
    }
};
export async function registerSocialRoutes(app) {
    app.get("/api/friends/me", async (request) => {
        const user = requireUser(request);
        const [friendships, incomingCount, outgoingCount] = await Promise.all([
            app.prisma.friendship.findMany({
                where: {
                    status: "ACCEPTED",
                    OR: [{ requesterId: user.id }, { addresseeId: user.id }]
                },
                include: {
                    requester: { include: publicUserInclude },
                    addressee: { include: publicUserInclude }
                },
                orderBy: { updatedAt: "desc" }
            }),
            app.prisma.friendship.count({ where: { addresseeId: user.id, status: "PENDING" } }),
            app.prisma.friendship.count({ where: { requesterId: user.id, status: "PENDING" } })
        ]);
        return {
            friends: friendships.map((friendship) => serializePublicUser(request, friendship.requesterId === user.id ? friendship.addressee : friendship.requester)),
            incomingCount,
            outgoingCount
        };
    });
    app.get("/api/users/:username/friends", async (request) => {
        const params = usernameParams.parse(request.params);
        const target = await findUserByUsername(app, params.username);
        if (!target)
            fail(404, "USER_NOT_FOUND", "User was not found");
        const friendships = await app.prisma.friendship.findMany({
            where: {
                status: "ACCEPTED",
                OR: [{ requesterId: target.id }, { addresseeId: target.id }]
            },
            include: {
                requester: { include: publicUserInclude },
                addressee: { include: publicUserInclude }
            },
            orderBy: { updatedAt: "desc" },
            take: 100
        });
        return {
            count: friendships.length,
            state: await friendshipState(app, request.currentUser?.id ?? null, target.id),
            friends: friendships.map((friendship) => serializePublicUser(request, friendship.requesterId === target.id ? friendship.addressee : friendship.requester))
        };
    });
    app.post("/api/users/:username/friend", async (request) => {
        const actor = requireUser(request);
        const params = usernameParams.parse(request.params);
        const target = await findUserByUsername(app, params.username);
        if (!target)
            fail(404, "USER_NOT_FOUND", "User was not found");
        if (target.id === actor.id)
            fail(400, "SELF_FRIEND_REQUEST", "You cannot add yourself as a friend");
        const pair = orderedPair(actor.id, target.id);
        const existing = await app.prisma.friendship.findUnique({ where: { pairKey: pair.key } });
        if (existing?.status === "ACCEPTED") {
            return { state: "accepted", friendship: existing };
        }
        if (existing?.status === "PENDING") {
            if (existing.addresseeId !== actor.id) {
                return { state: "pending_sent", friendship: existing };
            }
            const [friendship] = await app.prisma.$transaction([
                app.prisma.friendship.update({
                    where: { id: existing.id },
                    data: { status: "ACCEPTED" }
                }),
                app.prisma.directConversation.upsert({
                    where: { pairKey: pair.key },
                    create: { pairKey: pair.key, userAId: pair.a, userBId: pair.b },
                    update: {}
                })
            ]);
            await createNotification(app, {
                userId: existing.requesterId,
                type: "friend.accepted",
                title: `${actor.username} accepted your friend request`,
                url: `/u/${actor.username}`
            });
            return { state: "accepted", friendship };
        }
        const friendship = await app.prisma.friendship.create({
            data: {
                requesterId: actor.id,
                addresseeId: target.id,
                pairKey: pair.key,
                status: "PENDING"
            }
        });
        await createNotification(app, {
            userId: target.id,
            type: "friend.request",
            title: `${actor.username} sent you a friend request`,
            body: "Open their profile to accept it.",
            url: `/u/${actor.username}`
        });
        return { state: "pending_sent", friendship };
    });
    app.delete("/api/users/:username/friend", async (request) => {
        const actor = requireUser(request);
        const params = usernameParams.parse(request.params);
        const target = await findUserByUsername(app, params.username);
        if (!target)
            fail(404, "USER_NOT_FOUND", "User was not found");
        if (target.id === actor.id)
            fail(400, "SELF_FRIEND_REQUEST", "You cannot remove yourself as a friend");
        await app.prisma.friendship.deleteMany({ where: { pairKey: orderedPair(actor.id, target.id).key } });
        return { ok: true, state: "none" };
    });
    app.get("/api/messages/conversations", async (request) => {
        const user = requireUser(request);
        const conversations = await app.prisma.directConversation.findMany({
            where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
            include: {
                userA: { include: publicUserInclude },
                userB: { include: publicUserInclude },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: { sender: { include: publicUserInclude } }
                }
            },
            orderBy: { updatedAt: "desc" },
            take: 100
        });
        return {
            conversations: conversations.map((conversation) => ({
                id: conversation.id,
                friend: serializePublicUser(request, conversation.userAId === user.id ? conversation.userB : conversation.userA),
                lastMessage: conversation.messages[0] ? serializeDirectMessage(request, conversation.messages[0]) : null,
                updatedAt: conversation.updatedAt
            }))
        };
    });
    app.get("/api/messages/conversations/:id", async (request) => {
        const user = requireUser(request);
        const params = conversationParams.parse(request.params);
        const conversation = await app.prisma.directConversation.findFirst({
            where: { id: params.id, OR: [{ userAId: user.id }, { userBId: user.id }] },
            include: {
                userA: { include: publicUserInclude },
                userB: { include: publicUserInclude },
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 200,
                    include: { sender: { include: publicUserInclude } }
                }
            }
        });
        if (!conversation)
            fail(404, "CONVERSATION_NOT_FOUND", "Conversation was not found");
        await app.prisma.directMessage.updateMany({
            where: { conversationId: conversation.id, senderId: { not: user.id }, readAt: null },
            data: { readAt: new Date() }
        });
        return serializeConversation(request, conversation, user.id);
    });
    app.post("/api/messages/:username", async (request) => {
        const actor = requireUser(request);
        const params = usernameParams.parse(request.params);
        const body = messageBody.parse(request.body);
        const target = await findUserByUsername(app, params.username);
        if (!target)
            fail(404, "USER_NOT_FOUND", "User was not found");
        if (target.id === actor.id)
            fail(400, "SELF_MESSAGE", "You cannot message yourself");
        const pair = orderedPair(actor.id, target.id);
        const accepted = await app.prisma.friendship.count({ where: { pairKey: pair.key, status: "ACCEPTED" } });
        if (accepted !== 1)
            fail(403, "FRIEND_REQUIRED", "You can only message accepted friends");
        const conversation = await app.prisma.directConversation.upsert({
            where: { pairKey: pair.key },
            create: { pairKey: pair.key, userAId: pair.a, userBId: pair.b },
            update: {}
        });
        const message = await app.prisma.directMessage.create({
            data: { conversationId: conversation.id, senderId: actor.id, body: body.body },
            include: { sender: { include: publicUserInclude } }
        });
        await app.prisma.directConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
        await createNotification(app, {
            userId: target.id,
            type: "message.new",
            title: `New message from ${actor.username}`,
            body: body.body.slice(0, 140),
            url: "/dashboard/messages"
        });
        const payload = { conversationId: conversation.id, message: serializeDirectMessage(request, message) };
        app.io.to(`user:${target.id}`).emit("message:new", payload);
        app.io.to(`user:${actor.id}`).emit("message:new", payload);
        return { conversationId: conversation.id, message: payload.message };
    });
}
async function findUserByUsername(app, username) {
    return app.prisma.user.findUnique({
        where: { username: username.toLowerCase() },
        include: publicUserInclude
    });
}
async function friendshipState(app, actorId, targetId) {
    if (!actorId)
        return "guest";
    if (actorId === targetId)
        return "self";
    const friendship = await app.prisma.friendship.findUnique({ where: { pairKey: orderedPair(actorId, targetId).key } });
    if (!friendship)
        return "none";
    if (friendship.status === "ACCEPTED")
        return "accepted";
    if (friendship.requesterId === actorId)
        return "pending_sent";
    if (friendship.addresseeId === actorId)
        return "pending_received";
    return "none";
}
function orderedPair(userAId, userBId) {
    const a = userAId < userBId ? userAId : userBId;
    const b = userAId < userBId ? userBId : userAId;
    return { a, b, key: `${a}:${b}` };
}
function serializePublicUser(request, user) {
    const avatarFile = user.profile?.files.find((file) => file.id === user.profile?.avatarFileId) ?? null;
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        profileId: user.profile?.id ?? null,
        uid: user.profile?.uid ?? null,
        displayName: user.profile?.displayName || user.username,
        avatar: serializeAsset(request, avatarFile)
    };
}
function serializeDirectMessage(request, message) {
    return {
        id: message.id,
        body: message.body,
        readAt: message.readAt,
        createdAt: message.createdAt,
        sender: serializePublicUser(request, message.sender)
    };
}
function serializeConversation(request, conversation, actorUserId) {
    return {
        conversation: {
            id: conversation.id,
            friend: serializePublicUser(request, conversation.userAId === actorUserId ? conversation.userB : conversation.userA),
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt
        },
        messages: conversation.messages.map((message) => serializeDirectMessage(request, message))
    };
}
//# sourceMappingURL=social.js.map