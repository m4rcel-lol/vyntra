import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isProduction } from "../env.js";
import { requireUser } from "../lib/auth.js";
import { sanitizeCustomCss } from "../lib/css.js";
import { hashIp, hashVisitor } from "../lib/crypto.js";
import { fail } from "../lib/errors.js";
import { getClientIp, getCountryFromHeaders, getReferrer, getVisitorHash, parseUserAgent } from "../lib/http.js";
import { serializeAsset } from "../lib/serialize.js";
import { metadataSchema, profileEffectsSchema, profileThemeSchema, urlSchema } from "../lib/validators.js";
import { isRouteReserved, usernameSchema } from "../lib/username.js";

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(80).optional(),
  layout: z
    .enum([
      "centered-glass",
      "wide-horizontal",
      "compact",
      "minimal-text",
      "split-sidebar",
      "floating-card",
      "terminal",
      "portfolio-grid"
    ])
    .optional(),
  statusText: z.string().max(120).optional(),
  discordPresence: z.record(z.unknown()).optional(),
  musicActivity: z.record(z.unknown()).optional(),
  theme: profileThemeSchema.optional(),
  effects: profileEffectsSchema.optional(),
  metadata: metadataSchema.optional(),
  embeds: z
    .array(
      z.object({
        type: z.enum(["youtube", "twitch", "spotify", "soundcloud", "custom"]),
        title: z.string().max(80),
        url: urlSchema
      })
    )
    .max(8)
    .optional(),
  customCss: z.string().max(6000).optional(),
  clickToEnter: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  aliasSlug: usernameSchema.nullable().optional(),
  avatarFileId: z.string().cuid().nullable().optional(),
  bannerFileId: z.string().cuid().nullable().optional(),
  backgroundFileId: z.string().cuid().nullable().optional(),
  audioFileId: z.string().cuid().nullable().optional(),
  cursorFileId: z.string().cuid().nullable().optional(),
  metadataFileId: z.string().cuid().nullable().optional()
});

const linkCreateSchema = z.object({
  title: z.string().trim().min(1).max(80),
  url: urlSchema,
  kind: z.string().trim().min(1).max(32).default("website"),
  isVisible: z.boolean().default(true),
  order: z.number().int().min(0).max(1000).optional(),
  iconFileId: z.string().cuid().nullable().optional(),
  style: z.record(z.unknown()).optional()
});

const linkUpdateSchema = linkCreateSchema.partial();

const reorderSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100)
});

const customBadgeSchema = z.object({
  name: z.string().trim().min(1).max(32),
  tooltip: z.string().trim().max(120).default(""),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#d4d4d4"),
  glowColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ffffff"),
  iconFileId: z.string().cuid().nullable().optional()
});

export async function registerProfileRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/profiles/me", async (request) => {
    const user = requireUser(request);
    const profile = await app.prisma.profile.findUnique({
      where: { userId: user.id },
      include: profileInclude(false)
    });
    if (!profile) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    return serializeProfile(request, profile);
  });

  app.patch("/api/profiles/me", async (request) => {
    const user = requireUser(request);
    const body = profileUpdateSchema.parse(request.body);
    await validateProfileFiles(app, user.id, body);

    if (body.aliasSlug) {
      if (isRouteReserved(body.aliasSlug)) {
        fail(400, "ALIAS_RESERVED", "That alias is reserved");
      }
      const reserved = await app.prisma.reservedUsername.findUnique({
        where: { normalized: body.aliasSlug }
      });
      if (reserved) fail(400, "ALIAS_RESERVED", "That alias is reserved");
    }

    const updateData: Prisma.ProfileUncheckedUpdateInput = {};
    if (body.displayName !== undefined) updateData.displayName = body.displayName;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.layout !== undefined) updateData.layout = body.layout;
    if (body.statusText !== undefined) updateData.statusText = body.statusText;
    if (body.discordPresence !== undefined) updateData.discordPresence = body.discordPresence as Prisma.InputJsonValue;
    if (body.musicActivity !== undefined) updateData.musicActivity = body.musicActivity as Prisma.InputJsonValue;
    if (body.theme !== undefined) updateData.theme = body.theme as Prisma.InputJsonValue;
    if (body.effects !== undefined) updateData.effects = body.effects as Prisma.InputJsonValue;
    if (body.metadata !== undefined) updateData.metadata = body.metadata as Prisma.InputJsonValue;
    if (body.embeds !== undefined) updateData.embeds = body.embeds as Prisma.InputJsonValue;
    if (body.customCss !== undefined) {
      updateData.customCss = body.customCss;
      updateData.sanitizedCss = sanitizeCustomCss(body.customCss);
    }
    if (body.clickToEnter !== undefined) updateData.clickToEnter = body.clickToEnter;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.aliasSlug !== undefined) updateData.aliasSlug = body.aliasSlug;
    if (body.avatarFileId !== undefined) updateData.avatarFileId = body.avatarFileId;
    if (body.bannerFileId !== undefined) updateData.bannerFileId = body.bannerFileId;
    if (body.backgroundFileId !== undefined) updateData.backgroundFileId = body.backgroundFileId;
    if (body.audioFileId !== undefined) updateData.audioFileId = body.audioFileId;
    if (body.cursorFileId !== undefined) updateData.cursorFileId = body.cursorFileId;
    if (body.metadataFileId !== undefined) updateData.metadataFileId = body.metadataFileId;

    const profile = await app.prisma.profile.update({
      where: { userId: user.id },
      data: updateData,
      include: profileInclude(false)
    });

    app.io.to(`profile:${user.username}`).emit("profile:update", { username: user.username });
    return serializeProfile(request, profile);
  });

  app.get("/api/profiles/public/:username", async (request) => {
    const params = z.object({ username: z.string().min(1).max(40) }).parse(request.params);
    const username = params.username.toLowerCase();
    const profile = await app.prisma.profile.findFirst({
      where: {
        isPublic: true,
        OR: [{ user: { username } }, { aliasSlug: username }]
      },
      include: profileInclude(true)
    });
    if (!profile || profile.user.isBanned) {
      fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    }
    return serializeProfile(request, profile);
  });

  app.post("/api/profiles/:username/view", async (request, reply) => {
    const params = z.object({ username: z.string().min(1).max(40) }).parse(request.params);
    const username = params.username.toLowerCase();
    const profile = await app.prisma.profile.findFirst({
      where: { isPublic: true, OR: [{ user: { username } }, { aliasSlug: username }] },
      include: { user: { select: { isBanned: true, username: true } } }
    });
    if (!profile || profile.user.isBanned) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");

    const visitorCookie = request.cookies.vyntra_visitor;
    const visitorToken = visitorCookie ?? cryptoRandomVisitor();
    const visitorHash = hashVisitor(`${visitorToken}:${request.headers["user-agent"] ?? ""}`);
    const { browser, device } = parseUserAgent(request);
    const country = getCountryFromHeaders(request);
    const referrer = getReferrer(request);
    const ipHash = hashIp(getClientIp(request));
    if (!visitorCookie) {
      reply.setCookie("vyntra_visitor", visitorToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        path: "/",
        maxAge: 60 * 60 * 24 * 365
      });
    }

    const dedupeKey = `profile-view:${profile.id}:${visitorHash}`;
    const shouldRecord = await app.redis.set(dedupeKey, "1", "EX", 30, "NX");
    if (!shouldRecord) {
      return { ok: true, deduped: true, viewCount: profile.viewCount };
    }

    const [updatedProfile] = await app.prisma.$transaction([
      app.prisma.profile.update({
        where: { id: profile.id },
        data: { viewCount: { increment: 1 } }
      }),
      app.prisma.profileView.create({
        data: { profileId: profile.id, visitorHash, referrer, country, browser, device }
      }),
      app.prisma.analyticsEvent.create({
        data: {
          profileId: profile.id,
          type: "PROFILE_VIEW",
          path: request.url,
          referrer,
          visitorHash,
          ipHash,
          country,
          browser,
          device
        }
      })
    ]);

    app.io.to(`profile:${profile.user.username}`).emit("profile:view", {
      username: profile.user.username,
      viewCount: updatedProfile.viewCount
    });
    return { ok: true, viewCount: updatedProfile.viewCount };
  });

  app.get("/api/leaderboard", async (request) => {
    const profiles = await app.prisma.profile.findMany({
      where: { isPublic: true, user: { isBanned: false } },
      orderBy: [{ viewCount: "desc" }, { createdAt: "asc" }],
      take: 50,
      include: {
        user: { select: { username: true } },
        files: { where: { deletedAt: null, kind: "AVATAR" } }
      }
    });
    return {
      profiles: profiles.map((profile, index) => {
        const fileById = new Map(profile.files.map((file) => [file.id, file]));
        return {
          rank: index + 1,
          username: profile.user.username,
          displayName: profile.displayName,
          bio: profile.bio,
          viewCount: profile.viewCount,
          layout: profile.layout,
          avatar: serializeAsset(request, profile.avatarFileId ? fileById.get(profile.avatarFileId) : null)
        };
      })
    };
  });

  app.post("/api/links", async (request) => {
    const user = requireUser(request);
    if (!user.profileId) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    const body = linkCreateSchema.parse(request.body);
    if (body.iconFileId) await assertOwnedFile(app, user.id, body.iconFileId);
    const count = await app.prisma.link.count({ where: { profileId: user.profileId } });
    if (count >= 100) fail(400, "LINK_LIMIT", "Profiles can have up to 100 links");

    const link = await app.prisma.link.create({
      data: {
        profileId: user.profileId,
        title: body.title,
        url: body.url,
        kind: body.kind,
        isVisible: body.isVisible,
        order: body.order ?? count,
        iconFileId: body.iconFileId ?? null,
        style: (body.style ?? {}) as Prisma.InputJsonValue
      }
    });
    return { link };
  });

  app.patch("/api/links/:id", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = linkUpdateSchema.parse(request.body);
    const link = await app.prisma.link.findUnique({ where: { id: params.id } });
    if (!link || link.profileId !== user.profileId) fail(404, "LINK_NOT_FOUND", "Link was not found");
    if (body.iconFileId) await assertOwnedFile(app, user.id, body.iconFileId);

    const linkData: Prisma.LinkUncheckedUpdateInput = {};
    if (body.title !== undefined) linkData.title = body.title;
    if (body.url !== undefined) linkData.url = body.url;
    if (body.kind !== undefined) linkData.kind = body.kind;
    if (body.isVisible !== undefined) linkData.isVisible = body.isVisible;
    if (body.order !== undefined) linkData.order = body.order;
    if (body.iconFileId !== undefined) linkData.iconFileId = body.iconFileId;
    if (body.style !== undefined) linkData.style = body.style as Prisma.InputJsonValue;

    const updated = await app.prisma.link.update({
      where: { id: params.id },
      data: linkData
    });
    return { link: updated };
  });

  app.delete("/api/links/:id", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const link = await app.prisma.link.findUnique({ where: { id: params.id } });
    if (!link || link.profileId !== user.profileId) fail(404, "LINK_NOT_FOUND", "Link was not found");
    await app.prisma.link.delete({ where: { id: params.id } });
    return { ok: true };
  });

  app.post("/api/links/reorder", async (request) => {
    const user = requireUser(request);
    if (!user.profileId) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    const body = reorderSchema.parse(request.body);
    const links = await app.prisma.link.findMany({
      where: { profileId: user.profileId, id: { in: body.ids } },
      select: { id: true }
    });
    if (links.length !== body.ids.length) fail(400, "INVALID_LINK_ORDER", "Link order contains invalid links");
    await app.prisma.$transaction(
      body.ids.map((id, order) => app.prisma.link.update({ where: { id }, data: { order } }))
    );
    return { ok: true };
  });

  app.post("/api/links/:id/click", async (request) => {
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const link = await app.prisma.link.findUnique({
      where: { id: params.id },
      include: { profile: { include: { user: { select: { username: true, isBanned: true } } } } }
    });
    if (!link || !link.isVisible || !link.profile.isPublic || link.profile.user.isBanned) {
      fail(404, "LINK_NOT_FOUND", "Link was not found");
    }
    const visitorHash = getVisitorHash(request);
    const { browser, device } = parseUserAgent(request);
    const country = getCountryFromHeaders(request);
    const referrer = getReferrer(request);
    await app.prisma.$transaction([
      app.prisma.link.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } }),
      app.prisma.linkClick.create({
        data: { linkId: link.id, profileId: link.profileId, visitorHash, referrer, country, browser, device }
      }),
      app.prisma.analyticsEvent.create({
        data: {
          profileId: link.profileId,
          type: link.kind === "website" ? "LINK_CLICK" : "SOCIAL_CLICK",
          path: request.url,
          referrer,
          visitorHash,
          country,
          browser,
          device,
          metadata: { linkId: link.id, kind: link.kind }
        }
      })
    ]);
    app.io.to(`profile:${link.profile.user.username}`).emit("profile:click", { linkId: link.id });
    return { ok: true };
  });

  app.get("/api/badges", async (request) => {
    const user = requireUser(request);
    const badges = await app.prisma.badge.findMany({
      where: { OR: [{ isGlobal: true }, { ownerUserId: user.id }] },
      orderBy: [{ isGlobal: "desc" }, { name: "asc" }],
      include: { icon: true }
    });
    return {
      badges: badges.map((badge) => ({
        ...badge,
        icon: serializeAsset(request, badge.icon)
      }))
    };
  });

  app.post("/api/badges/custom", async (request) => {
    const user = requireUser(request);
    if (!user.profileId) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    const body = customBadgeSchema.parse(request.body);
    if (body.iconFileId) await assertOwnedFile(app, user.id, body.iconFileId);

    const badge = await app.prisma.badge.create({
      data: {
        ownerUserId: user.id,
        slug: `custom-${user.id}-${Date.now()}`,
        name: body.name,
        tooltip: body.tooltip,
        color: body.color,
        glowColor: body.glowColor,
        iconFileId: body.iconFileId ?? null
      }
    });
    await app.prisma.userBadge.create({
      data: { profileId: user.profileId, badgeId: badge.id, assignedById: user.id }
    });
    return { badge };
  });
}

function profileInclude(visibleOnly: boolean) {
  return {
    user: {
      select: {
        id: true,
        username: true,
        role: true,
        isBanned: true,
        createdAt: true
      }
    },
    links: {
      where: visibleOnly ? { isVisible: true } : {},
      orderBy: { order: "asc" as const },
      include: { icon: true }
    },
    badges: {
      orderBy: { order: "asc" as const },
      include: { badge: { include: { icon: true } } }
    },
    files: { where: { deletedAt: null } }
  } satisfies Prisma.ProfileInclude;
}

type ProfilePayload = Prisma.ProfileGetPayload<{ include: ReturnType<typeof profileInclude> }>;

function serializeProfile(request: FastifyRequest, profile: ProfilePayload) {
  const fileById = new Map(profile.files.map((file) => [file.id, file]));
  return {
    profile: {
      id: profile.id,
      uid: profile.uid,
      username: profile.user.username,
      displayName: profile.displayName,
      bio: profile.bio,
      location: profile.location,
      layout: profile.layout,
      statusText: profile.statusText,
      discordPresence: profile.discordPresence,
      musicActivity: profile.musicActivity,
      theme: profile.theme,
      effects: profile.effects,
      metadata: profile.metadata,
      embeds: profile.embeds,
      customCss: profile.customCss,
      sanitizedCss: profile.sanitizedCss,
      clickToEnter: profile.clickToEnter,
      viewCount: profile.viewCount,
      aliasSlug: profile.aliasSlug,
      isPublic: profile.isPublic,
      joinedAt: profile.user.createdAt,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      assets: {
        avatar: serializeAsset(request, profile.avatarFileId ? fileById.get(profile.avatarFileId) : null),
        banner: serializeAsset(request, profile.bannerFileId ? fileById.get(profile.bannerFileId) : null),
        background: serializeAsset(request, profile.backgroundFileId ? fileById.get(profile.backgroundFileId) : null),
        audio: serializeAsset(request, profile.audioFileId ? fileById.get(profile.audioFileId) : null),
        cursor: serializeAsset(request, profile.cursorFileId ? fileById.get(profile.cursorFileId) : null),
        metadata: serializeAsset(request, profile.metadataFileId ? fileById.get(profile.metadataFileId) : null)
      }
    },
    links: profile.links.map((link) => ({
      id: link.id,
      title: link.title,
      url: link.url,
      kind: link.kind,
      order: link.order,
      isVisible: link.isVisible,
      clickCount: link.clickCount,
      style: link.style,
      icon: serializeAsset(request, link.icon)
    })),
    badges: profile.badges.map((userBadge) => ({
      id: userBadge.badge.id,
      name: userBadge.badge.name,
      slug: userBadge.badge.slug,
      color: userBadge.badge.color,
      glowColor: userBadge.badge.glowColor,
      tooltip: userBadge.badge.tooltip,
      isGlobal: userBadge.badge.isGlobal,
      icon: serializeAsset(request, userBadge.badge.icon)
    }))
  };
}

async function validateProfileFiles(
  app: FastifyInstance,
  userId: string,
  body: z.infer<typeof profileUpdateSchema>
): Promise<void> {
  const ids = [
    body.avatarFileId,
    body.bannerFileId,
    body.backgroundFileId,
    body.audioFileId,
    body.cursorFileId,
    body.metadataFileId
  ].filter((id): id is string => Boolean(id));

  if (ids.length === 0) return;
  const count = await app.prisma.fileAsset.count({
    where: { id: { in: ids }, ownerUserId: userId, deletedAt: null }
  });
  if (count !== ids.length) fail(400, "INVALID_FILE_ASSET", "One or more selected files are invalid");
}

async function assertOwnedFile(app: FastifyInstance, userId: string, id: string): Promise<void> {
  const file = await app.prisma.fileAsset.findFirst({
    where: { id, ownerUserId: userId, deletedAt: null }
  });
  if (!file) fail(400, "INVALID_FILE_ASSET", "Selected file is invalid");
}

function cryptoRandomVisitor(): string {
  return randomBytes(24).toString("base64url");
}
