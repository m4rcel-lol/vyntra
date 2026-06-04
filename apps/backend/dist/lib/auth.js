import { env, secureCookies } from "../env.js";
import { constantTimeEqual, createCsrfToken, createSessionToken, hashIp, sha256 } from "./crypto.js";
import { fail } from "./errors.js";
import { getClientIp } from "./http.js";
const SESSION_CACHE_SECONDS = 60;
function sessionCookieOptions(expires) {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookies,
        path: "/",
        ...(expires ? { expires } : {})
    };
}
export async function createSession(params) {
    const token = createSessionToken();
    const tokenHash = sha256(token);
    const csrfToken = createCsrfToken();
    const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const userAgent = params.request.headers["user-agent"]?.slice(0, 500) ?? null;
    const ipHash = hashIp(getClientIp(params.request));
    const session = await params.prisma.session.create({
        data: {
            userId: params.userId,
            tokenHash,
            csrfToken,
            expiresAt,
            userAgent,
            ipHash
        }
    });
    await params.redis.del(`session:${tokenHash}`);
    params.reply.setCookie(env.SESSION_COOKIE_NAME, token, sessionCookieOptions(expiresAt));
    return { csrfToken: session.csrfToken };
}
export function clearSessionCookie(reply) {
    reply.clearCookie(env.SESSION_COOKIE_NAME, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookies
    });
}
export async function hydrateAuth(request) {
    const token = request.cookies[env.SESSION_COOKIE_NAME];
    if (!token)
        return;
    const tokenHash = sha256(token);
    const cacheKey = `session:${tokenHash}`;
    const cached = await request.server.redis.get(cacheKey);
    if (cached) {
        const parsed = JSON.parse(cached);
        request.currentUser = parsed.user;
        request.currentSession = parsed.session;
        return;
    }
    const session = await request.server.prisma.session.findUnique({
        where: { tokenHash },
        include: {
            user: {
                include: {
                    profile: { select: { id: true } }
                }
            }
        }
    });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
        await request.server.redis.del(cacheKey);
        return;
    }
    const user = {
        id: session.user.id,
        username: session.user.username,
        role: session.user.role,
        isBanned: session.user.isBanned,
        profileId: session.user.profile?.id ?? null
    };
    const authSession = {
        id: session.id,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt.toISOString()
    };
    request.currentUser = user;
    request.currentSession = authSession;
    await Promise.all([
        request.server.redis.set(cacheKey, JSON.stringify({ user, session: authSession }), "EX", SESSION_CACHE_SECONDS),
        request.server.prisma.session.update({
            where: { id: session.id },
            data: { lastSeenAt: new Date() }
        })
    ]);
}
export function requireUser(request) {
    if (!request.currentUser || !request.currentSession) {
        fail(401, "UNAUTHENTICATED", "Authentication is required");
    }
    if (request.currentUser.isBanned) {
        fail(403, "ACCOUNT_BANNED", "This account is banned");
    }
    return request.currentUser;
}
export function requireRole(request, roles) {
    const user = requireUser(request);
    if (!roles.includes(user.role)) {
        fail(403, "FORBIDDEN", "You do not have permission to perform this action");
    }
    return user;
}
export function assertCsrf(request) {
    const method = request.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method))
        return;
    if (!request.url.startsWith("/api/"))
        return;
    if (request.url.startsWith("/api/auth/login") || request.url.startsWith("/api/auth/register"))
        return;
    if (/^\/api\/profiles\/[^/]+\/view(?:\?|$)/.test(request.url))
        return;
    const session = request.currentSession;
    if (!session)
        return;
    const token = request.headers["x-csrf-token"];
    if (typeof token !== "string" || !constantTimeEqual(token, session.csrfToken)) {
        fail(403, "CSRF_VALIDATION_FAILED", "CSRF token is missing or invalid");
    }
}
export async function revokeSession(params) {
    const token = params.request.cookies[env.SESSION_COOKIE_NAME];
    if (!token)
        return;
    const tokenHash = sha256(token);
    await Promise.all([
        params.prisma.session.updateMany({
            where: { tokenHash, revokedAt: null },
            data: { revokedAt: new Date() }
        }),
        params.redis.del(`session:${tokenHash}`)
    ]);
}
//# sourceMappingURL=auth.js.map