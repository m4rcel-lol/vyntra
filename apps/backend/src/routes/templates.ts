import type { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import { sanitizeCustomCss } from "../lib/css.js";
import { fail } from "../lib/errors.js";
import { serializeAsset } from "../lib/serialize.js";

const templateWriteSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).default(""),
  style: z
    .enum(["minimal", "anime", "cyberpunk", "clean", "portfolio", "gaming", "dark", "colorful", "music", "developer"])
    .default("dark"),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).default([]),
  isPublished: z.boolean().default(false),
  previewFileId: z.string().cuid().nullable().optional()
});

const templateQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  style: z.string().trim().max(40).optional(),
  tag: z.string().trim().max(24).optional()
});

export async function registerTemplateRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/templates", async (request) => {
    const query = templateQuerySchema.parse(request.query);
    const templates = await app.prisma.template.findMany({
      where: {
        isPublished: true,
        ...(query.style ? { style: query.style } : {}),
        ...(query.tag ? { tags: { has: query.tag } } : {}),
        ...(query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { description: { contains: query.q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      include: {
        owner: {
          select: {
            username: true,
            profile: {
              select: {
                avatarFileId: true,
                files: { where: { deletedAt: null, kind: "AVATAR" } }
              }
            }
          }
        },
        previewFile: true
      },
      orderBy: [{ likeCount: "desc" }, { importCount: "desc" }, { createdAt: "desc" }],
      take: 60
    });

    return {
      templates: templates.map((template) => {
        const ownerFiles = template.owner.profile?.files ?? [];
        const ownerFileById = new Map(ownerFiles.map((file) => [file.id, file]));
        return {
          id: template.id,
          name: template.name,
          description: template.description,
          style: template.style,
          tags: template.tags,
          ownerUsername: template.owner.username,
          ownerAvatar: serializeAsset(
            request,
            template.owner.profile?.avatarFileId ? ownerFileById.get(template.owner.profile.avatarFileId) : null
          ),
          importCount: template.importCount,
          likeCount: template.likeCount,
          preview: serializeAsset(request, template.previewFile),
          createdAt: template.createdAt
        };
      })
    };
  });

  app.get("/api/templates/mine", async (request) => {
    const user = requireUser(request);
    const templates = await app.prisma.template.findMany({
      where: { ownerUserId: user.id },
      include: { previewFile: true },
      orderBy: { updatedAt: "desc" }
    });
    return {
      templates: templates.map((template) => ({
        ...template,
        preview: serializeAsset(request, template.previewFile)
      }))
    };
  });

  app.get("/api/templates/:id", async (request) => {
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const template = await app.prisma.template.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            username: true,
            profile: {
              select: {
                avatarFileId: true,
                files: { where: { deletedAt: null, kind: "AVATAR" } }
              }
            }
          }
        },
        previewFile: true
      }
    });
    if (!template || !template.isPublished) fail(404, "TEMPLATE_NOT_FOUND", "Template was not found");
    const ownerFiles = template.owner.profile?.files ?? [];
    const ownerFileById = new Map(ownerFiles.map((file) => [file.id, file]));
    const { owner: _owner, previewFile: _previewFile, ...templateFields } = template;
    return {
      template: {
        ...templateFields,
        ownerUsername: template.owner.username,
        ownerAvatar: serializeAsset(
          request,
          template.owner.profile?.avatarFileId ? ownerFileById.get(template.owner.profile.avatarFileId) : null
        ),
        preview: serializeAsset(request, template.previewFile)
      }
    };
  });

  app.post("/api/templates/from-profile", async (request) => {
    const user = requireUser(request);
    if (!user.profileId) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    const body = templateWriteSchema.parse(request.body);
    if (body.previewFileId) await assertOwnedFile(app, user.id, body.previewFileId);

    const profile = await app.prisma.profile.findUnique({
      where: { id: user.profileId },
      include: { links: { orderBy: { order: "asc" } }, badges: { include: { badge: true }, orderBy: { order: "asc" } } }
    });
    if (!profile) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");

    const snapshot = {
      layout: profile.layout,
      statusText: profile.statusText,
      theme: profile.theme,
      effects: profile.effects,
      metadata: profile.metadata,
      embeds: profile.embeds,
      customCss: profile.customCss,
      clickToEnter: profile.clickToEnter,
      links: profile.links.map((link) => ({
        title: link.title,
        url: link.url,
        kind: link.kind,
        order: link.order,
        isVisible: link.isVisible,
        style: link.style
      })),
      badges: profile.badges.map((userBadge) => ({
        name: userBadge.badge.name,
        color: userBadge.badge.color,
        glowColor: userBadge.badge.glowColor,
        tooltip: userBadge.badge.tooltip
      }))
    };

    const template = await app.prisma.template.create({
      data: {
        ownerUserId: user.id,
        name: body.name,
        description: body.description,
        style: body.style,
        tags: body.tags,
        isPublished: body.isPublished,
        previewFileId: body.previewFileId ?? null,
        snapshot: snapshot as Prisma.InputJsonValue
      }
    });
    return { template };
  });

  app.patch("/api/templates/:id", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const body = templateWriteSchema.partial().parse(request.body);
    if (body.previewFileId) await assertOwnedFile(app, user.id, body.previewFileId);
    const template = await app.prisma.template.findUnique({ where: { id: params.id } });
    if (!template || template.ownerUserId !== user.id) fail(404, "TEMPLATE_NOT_FOUND", "Template was not found");
    const updated = await app.prisma.template.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.style !== undefined ? { style: body.style } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
        ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
        ...(body.previewFileId !== undefined ? { previewFileId: body.previewFileId } : {})
      }
    });
    return { template: updated };
  });

  app.post("/api/templates/:id/like", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const template = await app.prisma.template.findFirst({ where: { id: params.id, isPublished: true } });
    if (!template) fail(404, "TEMPLATE_NOT_FOUND", "Template was not found");

    const existing = await app.prisma.templateLike.findUnique({
      where: { templateId_userId: { templateId: template.id, userId: user.id } }
    });
    if (existing) {
      await app.prisma.$transaction([
        app.prisma.templateLike.delete({ where: { id: existing.id } }),
        app.prisma.template.update({ where: { id: template.id }, data: { likeCount: { decrement: 1 } } })
      ]);
      return { liked: false };
    }
    await app.prisma.$transaction([
      app.prisma.templateLike.create({ data: { templateId: template.id, userId: user.id } }),
      app.prisma.template.update({ where: { id: template.id }, data: { likeCount: { increment: 1 } } })
    ]);
    return { liked: true };
  });

  app.post("/api/templates/:id/import", async (request) => {
    const user = requireUser(request);
    if (!user.profileId) fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const template = await app.prisma.template.findFirst({ where: { id: params.id, isPublished: true } });
    if (!template) fail(404, "TEMPLATE_NOT_FOUND", "Template was not found");

    const snapshot = template.snapshot as TemplateSnapshot;
    await app.prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: user.profileId! },
        data: {
          layout: snapshot.layout,
          statusText: snapshot.statusText,
          theme: snapshot.theme as Prisma.InputJsonValue,
          effects: snapshot.effects as Prisma.InputJsonValue,
          metadata: snapshot.metadata as Prisma.InputJsonValue,
          embeds: snapshot.embeds as Prisma.InputJsonValue,
          customCss: snapshot.customCss,
          sanitizedCss: sanitizeCustomCss(snapshot.customCss),
          clickToEnter: snapshot.clickToEnter
        }
      });
      await tx.link.deleteMany({ where: { profileId: user.profileId! } });
      if (snapshot.links.length > 0) {
        await tx.link.createMany({
          data: snapshot.links.slice(0, 100).map((link) => ({
            profileId: user.profileId!,
            title: link.title,
            url: link.url,
            kind: link.kind,
            order: link.order,
            isVisible: link.isVisible,
            style: link.style as Prisma.InputJsonValue
          }))
        });
      }
      await tx.template.update({ where: { id: template.id }, data: { importCount: { increment: 1 } } });
      await tx.analyticsEvent.create({
        data: {
          userId: user.id,
          profileId: user.profileId,
          type: "TEMPLATE_IMPORT",
          metadata: { templateId: template.id }
        }
      });
    });
    return { ok: true };
  });
}

type TemplateSnapshot = {
  layout: string;
  statusText: string;
  theme: Record<string, unknown>;
  effects: Record<string, unknown>;
  metadata: Record<string, unknown>;
  embeds: unknown[];
  customCss: string;
  clickToEnter: boolean;
  links: Array<{
    title: string;
    url: string;
    kind: string;
    order: number;
    isVisible: boolean;
    style: Record<string, unknown>;
  }>;
};

async function assertOwnedFile(app: FastifyInstance, userId: string, id: string): Promise<void> {
  const file = await app.prisma.fileAsset.findFirst({
    where: { id, ownerUserId: userId, deletedAt: null }
  });
  if (!file) fail(400, "INVALID_FILE_ASSET", "Selected file is invalid");
}
