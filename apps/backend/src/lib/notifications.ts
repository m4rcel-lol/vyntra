import type { FastifyInstance } from "fastify";

export async function createNotification(
  app: FastifyInstance,
  params: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    url?: string;
  }
) {
  const notification = await app.prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body ?? "",
      url: params.url ?? ""
    }
  });

  app.io.to(`user:${params.userId}`).emit("notification:new", notification);
  return notification;
}
