import { z } from "zod";
import { env } from "../env.js";
import { sha256 } from "../lib/crypto.js";
const conversationEventSchema = z.object({
    conversationId: z.string().cuid()
});
const typingEventSchema = conversationEventSchema.extend({
    isTyping: z.boolean().default(false)
});
const voiceSignalSchema = conversationEventSchema.extend({
    offer: z.unknown().optional(),
    answer: z.unknown().optional(),
    candidate: z.unknown().optional()
});
export function registerRealtime(io, prisma) {
    io.use(async (socket, next) => {
        const token = parseCookie(socket.handshake.headers.cookie ?? "")[env.SESSION_COOKIE_NAME];
        if (!token) {
            next();
            return;
        }
        const session = await prisma.session.findUnique({
            where: { tokenHash: sha256(token) },
            include: { user: { include: { profile: { select: { id: true } } } } }
        });
        if (session && !session.revokedAt && session.expiresAt.getTime() > Date.now()) {
            socket.data.user = {
                id: session.user.id,
                username: session.user.username,
                role: session.user.role,
                profileId: session.user.profile?.id ?? null
            };
        }
        next();
    });
    io.on("connection", (socket) => {
        const user = socket.data.user;
        if (user) {
            socket.join(`user:${user.id}`);
            socket.join(`user:${user.username}`);
            socket.join(`profile:${user.username}`);
            if (user.role === "OWNER" || user.role === "ADMIN" || user.role === "MODERATOR")
                socket.join("admin");
            io.emit("presence:online", { username: user.username });
        }
        socket.on("profile:join", (username) => {
            if (typeof username === "string" && username.length <= 40) {
                socket.join(`profile:${username.toLowerCase()}`);
            }
        });
        socket.on("editor:preview", (payload) => {
            if (!user)
                return;
            socket.to(`profile:${user.username}`).emit("profile:preview", payload);
        });
        socket.on("presence:heartbeat", () => {
            if (user) {
                socket.emit("presence:ack", { username: user.username, at: new Date().toISOString() });
            }
        });
        socket.on("messages:join", async (payload) => {
            if (!user)
                return;
            const parsed = conversationEventSchema.safeParse(payload);
            if (!parsed.success)
                return;
            if (!(await canUseConversation(prisma, parsed.data.conversationId, user.id)))
                return;
            socket.join(conversationRoom(parsed.data.conversationId));
        });
        socket.on("messages:typing", async (payload) => {
            if (!user)
                return;
            const parsed = typingEventSchema.safeParse(payload);
            if (!parsed.success)
                return;
            if (!(await canUseConversation(prisma, parsed.data.conversationId, user.id)))
                return;
            socket.to(conversationRoom(parsed.data.conversationId)).emit("messages:typing", {
                conversationId: parsed.data.conversationId,
                userId: user.id,
                username: user.username,
                isTyping: parsed.data.isTyping
            });
        });
        socket.on("voice:offer", async (payload) => {
            await relayVoiceSignal("voice:offer", payload);
        });
        socket.on("voice:answer", async (payload) => {
            await relayVoiceSignal("voice:answer", payload);
        });
        socket.on("voice:ice", async (payload) => {
            await relayVoiceSignal("voice:ice", payload);
        });
        socket.on("voice:end", async (payload) => {
            await relayVoiceSignal("voice:end", payload);
        });
        async function relayVoiceSignal(event, payload) {
            if (!user)
                return;
            const parsed = voiceSignalSchema.safeParse(payload);
            if (!parsed.success)
                return;
            const conversation = await getConversationForUser(prisma, parsed.data.conversationId, user.id);
            if (!conversation)
                return;
            const recipientId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
            socket.to(conversationRoom(parsed.data.conversationId)).to(`user:${recipientId}`).emit(event, {
                ...parsed.data,
                from: { id: user.id, username: user.username }
            });
        }
        socket.on("disconnect", () => {
            if (user)
                io.emit("presence:offline", { username: user.username });
        });
    });
}
async function canUseConversation(prisma, conversationId, userId) {
    const conversation = await getConversationForUser(prisma, conversationId, userId);
    return !!conversation;
}
async function getConversationForUser(prisma, conversationId, userId) {
    return prisma.directConversation.findFirst({
        where: {
            id: conversationId,
            OR: [{ userAId: userId }, { userBId: userId }]
        },
        select: { id: true, userAId: true, userBId: true }
    });
}
function conversationRoom(conversationId) {
    return `conversation:${conversationId}`;
}
function parseCookie(header) {
    return Object.fromEntries(header
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
        const index = part.indexOf("=");
        if (index === -1)
            return [part, ""];
        return [decodeURIComponent(part.slice(0, index)), decodeURIComponent(part.slice(index + 1))];
    }));
}
//# sourceMappingURL=socket.js.map