import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { Server as SocketServer } from "socket.io";
import { allowedOrigins, env, secureCookies } from "./env.js";
import "./types.js";
import { assertCsrf, hydrateAuth } from "./lib/auth.js";
import { sendError } from "./lib/errors.js";
import { ensureStorageDir } from "./lib/storage.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerBlogRoutes } from "./routes/blog.js";
import { registerDashboardRoutes } from "./routes/dashboard.js";
import { registerFileRoutes } from "./routes/files.js";
import { registerForumRoutes } from "./routes/forums.js";
import { registerNotificationRoutes } from "./routes/notifications.js";
import { registerProfileRoutes } from "./routes/profiles.js";
import { registerPublicPageRoutes } from "./routes/public-pages.js";
import { registerReportRoutes } from "./routes/reports.js";
import { registerSocialRoutes } from "./routes/social.js";
import { registerSupportRoutes } from "./routes/support.js";
import { registerTemplateRoutes } from "./routes/templates.js";
import { registerRealtime } from "./realtime/socket.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: env.TRUST_PROXY
  });

  const prisma = new PrismaClient();
  const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });

  app.decorate("prisma", prisma);
  app.decorate("redis", redis);

  await app.register(cookie, { secret: env.COOKIE_SECRET });
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed"), false);
    },
    credentials: true
  });
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  });
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
      files: 1
    }
  });

  await ensureStorageDir();

  const io = new SocketServer(app.server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    transports: ["websocket", "polling"]
  });
  app.decorate("io", io);
  registerRealtime(io, prisma);

  app.addHook("preValidation", async (request) => {
    await hydrateAuth(request);
    assertCsrf(request);
  });

  app.setErrorHandler((error, _request, reply) => {
    requestLogSafe(app, error);
    sendError(reply, error);
  });

  app.get("/health", async () => ({
    ok: true,
    name: env.PUBLIC_APP_NAME,
    environment: env.NODE_ENV,
    secureCookies
  }));

  await registerAuthRoutes(app);
  await registerPublicPageRoutes(app);
  await registerBlogRoutes(app);
  await registerDashboardRoutes(app);
  await registerProfileRoutes(app);
  await registerSocialRoutes(app);
  await registerForumRoutes(app);
  await registerSupportRoutes(app);
  await registerNotificationRoutes(app);
  await registerFileRoutes(app);
  await registerTemplateRoutes(app);
  await registerAnalyticsRoutes(app);
  await registerReportRoutes(app);
  await registerAdminRoutes(app);

  app.addHook("onClose", async () => {
    io.close();
    await redis.quit();
    await prisma.$disconnect();
  });

  return app;
}

function requestLogSafe(app: ReturnType<typeof Fastify>, error: unknown): void {
  if (error instanceof Error) {
    app.log.error({ err: error }, error.message);
  } else {
    app.log.error({ err: error }, "Unknown error");
  }
}
