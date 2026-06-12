import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireUser } from "../lib/auth.js";

export async function registerNotificationRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/notifications", async (request) => {
    const user = requireUser(request);
    const notifications = await app.prisma.notification.findMany({
      where: { userId: user.id, clearedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return { notifications };
  });

  app.patch("/api/notifications/:id/read", async (request) => {
    const user = requireUser(request);
    const params = z.object({ id: z.string().cuid() }).parse(request.params);
    const notification = await app.prisma.notification.updateMany({
      where: { id: params.id, userId: user.id },
      data: { readAt: new Date() }
    });
    return { ok: notification.count > 0 };
  });

  app.post("/api/notifications/clear", async (request) => {
    const user = requireUser(request);
    await app.prisma.notification.updateMany({
      where: { userId: user.id, clearedAt: null },
      data: { clearedAt: new Date(), readAt: new Date() }
    });
    return { ok: true };
  });
}
