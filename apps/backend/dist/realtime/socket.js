import { env } from "../env.js";
import { sha256 } from "../lib/crypto.js";
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
            socket.join(`user:${user.username}`);
            socket.join(`profile:${user.username}`);
            if (user.role === "ADMIN" || user.role === "MODERATOR")
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
        socket.on("disconnect", () => {
            if (user)
                io.emit("presence:offline", { username: user.username });
        });
    });
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