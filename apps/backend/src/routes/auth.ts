import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createSession, clearSessionCookie, requireUser, revokeSession } from "../lib/auth.js";
import { hashIp, hashPassword, verifyPassword } from "../lib/crypto.js";
import { fail } from "../lib/errors.js";
import { getClientIp } from "../lib/http.js";
import { assertRateLimit } from "../lib/rate-limit.js";
import { emailSchema, passwordSchema } from "../lib/validators.js";
import { isRouteReserved, normalizeUsername, usernameSchema } from "../lib/username.js";

const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(200)
});

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/auth/register", async (request, reply) => {
    await assertRateLimit(app.redis, `register:${hashIp(getClientIp(request))}`, 5, 60 * 10);
    const body = registerSchema.parse(request.body);
    const username = normalizeUsername(body.username);
    if (isRouteReserved(username)) {
      fail(400, "USERNAME_RESERVED", "That username is reserved");
    }

    const reserved = await app.prisma.reservedUsername.findUnique({
      where: { normalized: username }
    });
    if (reserved) {
      fail(400, "USERNAME_RESERVED", "That username is reserved");
    }

    const passwordHash = await hashPassword(body.password);
    try {
      const user = await app.prisma.user.create({
        data: {
          username,
          ...(body.email ? { email: body.email } : {}),
          passwordHash,
          profile: {
            create: {
              displayName: username,
              theme: defaultTheme(),
              effects: defaultEffects(),
              metadata: {
                title: `${username} on Vyntra.bio`,
                description: "A creator profile on Vyntra.bio"
              },
              links: {
                create: [
                  {
                    title: "Website",
                    url: "https://example.com",
                    kind: "website",
                    order: 0,
                    isVisible: false
                  }
                ]
              }
            }
          }
        },
        include: { profile: true }
      });

      const globalBadges = await app.prisma.badge.findMany({
        where: { slug: { in: ["early-user", "unlimited"] }, isGlobal: true }
      });
      if (user.profile && globalBadges.length > 0) {
        await app.prisma.userBadge.createMany({
          data: globalBadges.map((badge, index) => ({
            profileId: user.profile!.id,
            badgeId: badge.id,
            order: index
          })),
          skipDuplicates: true
        });
      }

      const session = await createSession({ prisma: app.prisma, redis: app.redis, reply, request, userId: user.id });
      return reply.status(201).send({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          profileId: user.profile?.id ?? null
        },
        csrfToken: session.csrfToken
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        fail(409, "ACCOUNT_EXISTS", "Username or email is already in use");
      }
      throw error;
    }
  });

  app.post("/api/auth/login", async (request, reply) => {
    await assertRateLimit(app.redis, `login:${hashIp(getClientIp(request))}`, 10, 60 * 10);
    const body = loginSchema.parse(request.body);
    const identifier = body.identifier.toLowerCase();

    const user = await app.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }]
      },
      include: { profile: { select: { id: true } } }
    });

    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      fail(401, "INVALID_CREDENTIALS", "Invalid username, email, or password");
    }
    if (user.isBanned) {
      fail(403, "ACCOUNT_BANNED", "This account is banned");
    }

    await app.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    const session = await createSession({ prisma: app.prisma, redis: app.redis, reply, request, userId: user.id });
    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        profileId: user.profile?.id ?? null
      },
      csrfToken: session.csrfToken
    };
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await revokeSession({ prisma: app.prisma, redis: app.redis, request });
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/me", async (request) => {
    const user = requireUser(request);
    return {
      user,
      csrfToken: request.currentSession?.csrfToken ?? null
    };
  });

  app.get("/api/auth/sessions", async (request) => {
    const user = requireUser(request);
    const sessions = await app.prisma.session.findMany({
      where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true
      }
    });
    return { sessions };
  });
}

function defaultTheme() {
  return {
    fontFamily: "Inter",
    fontSize: 16,
    textColor: "#ffffff",
    accentColor: "#d8d8d8",
    cardBackground: "#0b0b0b",
    cardOpacity: 0.72,
    cardBlur: 22,
    borderRadius: 26,
    borderColor: "#ffffff22",
    borderGlow: true,
    avatarShape: "circle",
    avatarBorder: true,
    buttonStyle: "glass",
    socialIconStyle: "glow",
    badgePosition: "below-name",
    musicPlayerStyle: "compact"
  };
}

function defaultEffects() {
  return {
    blurOverlay: true,
    darkOverlay: 0.42,
    particles: "stars",
    cursorTrail: "glow",
    entranceAnimation: "scale",
    hoverAnimation: "lift",
    pageTransition: "fade",
    backgroundAnimation: "gradient"
  };
}
