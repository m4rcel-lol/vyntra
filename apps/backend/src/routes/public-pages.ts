import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { FileAsset, Profile } from "@prisma/client";
import { z } from "zod";
import { env } from "../env.js";
import { assetUrl } from "../lib/serialize.js";

const paramsSchema = z.object({
  username: z.string().trim().min(1).max(40)
});

const FRONTEND_SHELL_CACHE_MS = 30_000;

let cachedFrontendShell: { html: string; expiresAt: number } | null = null;

export async function registerPublicPageRoutes(app: FastifyInstance): Promise<void> {
  const renderProfilePage = async (request: FastifyRequest, reply: FastifyReply) => {
    const params = paramsSchema.parse(request.params);
    const username = params.username.toLowerCase();
    const shell = await loadFrontendShell(app);
    const profile = await app.prisma.profile.findFirst({
      where: {
        isPublic: true,
        user: { isBanned: false },
        OR: [{ user: { username } }, { aliasSlug: username }]
      },
      include: {
        user: { select: { username: true } },
        files: { where: { deletedAt: null } }
      }
    });

    if (!profile) {
      const title = "Profile not found · Vyntra";
      const description = "This Vyntra profile does not exist or is private.";
      return reply
        .code(404)
        .type("text/html; charset=utf-8")
        .header("Cache-Control", "no-store")
        .send(injectProfileMetadata(shell, { request, title, description }));
    }

    const metadata = asRecord(profile.metadata);
    const fileById = new Map(profile.files.map((file) => [file.id, file]));
    const metadataImage = profile.metadataFileId ? fileById.get(profile.metadataFileId) : null;
    const title = cleanText(metadata.title, 70)
      || `${profile.displayName || profile.user.username} · Vyntra`;
    const description = cleanText(metadata.description, 180)
      || cleanText(profile.bio, 180)
      || `${profile.displayName || profile.user.username}'s links and profile.`;
    const image = resolveProfileImageUrl(request, profile, metadata, metadataImage);

    return reply
      .type("text/html; charset=utf-8")
      .header("Cache-Control", "public, max-age=60")
      .send(injectProfileMetadata(shell, {
        request,
        title,
        description,
        image,
        username: profile.user.username
      }));
  };

  app.get("/u/:username", renderProfilePage);
  app.get("/u/:username/", renderProfilePage);
}

async function loadFrontendShell(app: FastifyInstance): Promise<string> {
  const now = Date.now();
  if (cachedFrontendShell && cachedFrontendShell.expiresAt > now) {
    return cachedFrontendShell.html;
  }

  for (const url of frontendShellUrls()) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "VyntraMetadataRenderer/1.0" }
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (!html.includes("</head>") || !html.includes("</html>")) continue;
      cachedFrontendShell = { html, expiresAt: now + FRONTEND_SHELL_CACHE_MS };
      return html;
    } catch (error) {
      app.log.warn({ err: error, url }, "Could not load frontend shell for profile metadata");
    }
  }

  return fallbackShell();
}

function frontendShellUrls(): string[] {
  const urls = [
    normalizeShellUrl(process.env.FRONTEND_SHELL_URL),
    "http://frontend/index.html"
  ].filter((url): url is string => Boolean(url));

  return [...new Set(urls)];
}

function normalizeShellUrl(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.toString();
  } catch {
    return "";
  }
}

function injectProfileMetadata(
  shell: string,
  params: {
    request: FastifyRequest;
    title: string;
    description: string;
    image?: string;
    username?: string;
  }
): string {
  const title = escapeHtml(params.title);
  const description = escapeHtml(params.description);
  const url = escapeHtml(profileRequestUrl(params.request));
  const image = params.image ? escapeHtml(params.image) : "";
  const siteName = escapeHtml(env.PUBLIC_APP_NAME || "Vyntra");
  const twitterCard = image ? "summary_large_image" : "summary";
  const profileUsername = params.username ? escapeHtml(params.username) : "";
  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${siteName}" />`,
    `<meta property="og:url" content="${url}" />`,
    profileUsername ? `<meta property="profile:username" content="${profileUsername}" />` : "",
    image ? `<meta property="og:image" content="${image}" />` : "",
    image ? `<meta property="og:image:secure_url" content="${image}" />` : "",
    `<meta name="twitter:card" content="${twitterCard}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    image ? `<meta name="twitter:image" content="${image}" />` : ""
  ].filter(Boolean);

  const cleanedShell = shell
    .replace(/<title>[\s\S]*?<\/title>\s*/i, "")
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:[^"']+|profile:[^"']+|twitter:[^"']+)["'][^>]*>\s*/gi, "");

  return cleanedShell.replace(/<\/head>/i, `    ${tags.join("\n    ")}\n  </head>`);
}

function resolveProfileImageUrl(
  request: FastifyRequest,
  profile: Profile,
  metadata: Record<string, unknown>,
  metadataImage: FileAsset | null | undefined
): string {
  if (metadataImage) {
    return safeAbsoluteUrl(request, assetUrl(request, metadataImage.publicId));
  }

  if (typeof metadata.ogImage === "string") {
    return safeAbsoluteUrl(request, metadata.ogImage);
  }

  return "";
}

function profileRequestUrl(request: FastifyRequest): string {
  return safeAbsoluteUrl(request, request.url) || absoluteFromOrigin(request.url, env.PUBLIC_APP_URL) || env.PUBLIC_APP_URL;
}

function safeAbsoluteUrl(request: FastifyRequest, value: string): string {
  const origin = requestOrigin(request);
  try {
    const url = new URL(value, origin);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function requestOrigin(request: FastifyRequest): string {
  const forwardedHost = firstHeader(request.headers["x-forwarded-host"]);
  const host = forwardedHost || firstHeader(request.headers.host);
  if (!host) return env.PUBLIC_APP_URL;

  const forwardedProto = firstHeader(request.headers["x-forwarded-proto"]);
  const fallbackProto = env.PUBLIC_APP_URL.startsWith("https://") ? "https" : "http";
  return `${forwardedProto || fallbackProto}://${host}`;
}

function firstHeader(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.split(",")[0]?.trim() || "";
  return value?.split(",")[0]?.trim() || "";
}

function absoluteFromOrigin(pathname: string, origin: string): string {
  try {
    return new URL(pathname, origin).toString();
  } catch {
    return "";
  }
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fallbackShell(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root"></div>
    <noscript>You need JavaScript enabled to run Vyntra.</noscript>
  </body>
</html>`;
}
