import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole, requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
import { createNotification } from "../lib/notifications.js";
import { serializeAsset } from "../lib/serialize.js";
const defaultCategories = [
    {
        slug: "general",
        name: "General",
        description: "Questions, ideas, and creator discussions.",
        order: 0
    },
    {
        slug: "support",
        name: "Help & Support",
        description: "Ask the community for setup, profile, and self-hosting help.",
        order: 1
    },
    {
        slug: "self-hosting",
        name: "Self-hosting",
        description: "Docker, reverse proxy, backups, updates, and server notes.",
        order: 2
    },
    {
        slug: "showcase",
        name: "Showcase",
        description: "Share profile designs, templates, and launch updates.",
        order: 3
    }
];
const threadCreateSchema = z.object({
    categoryId: z.string().cuid(),
    title: z.string().trim().min(4).max(120),
    bodyMarkdown: z.string().trim().min(10).max(12000)
});
const replySchema = z.object({
    bodyMarkdown: z.string().trim().min(1).max(8000)
});
const threadPatchSchema = z.object({
    isPinned: z.boolean().optional(),
    isLocked: z.boolean().optional()
});
const forumAuthorInclude = {
    profile: {
        select: {
            id: true,
            displayName: true,
            avatarFileId: true,
            files: { where: { deletedAt: null, kind: "AVATAR" } }
        }
    }
};
export async function registerForumRoutes(app) {
    app.get("/api/forums", async (request) => {
        await ensureDefaultForumCategories(app);
        const categories = await app.prisma.forumCategory.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: { select: { threads: true } },
                threads: {
                    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
                    take: 8,
                    include: { author: { include: forumAuthorInclude } }
                }
            }
        });
        return {
            categories: categories.map((category) => ({
                id: category.id,
                slug: category.slug,
                name: category.name,
                description: category.description,
                threadCount: category._count.threads,
                threads: category.threads.map((thread) => serializeThreadSummary(request, thread))
            }))
        };
    });
    app.post("/api/forums/threads", async (request) => {
        const user = requireUser(request);
        const body = threadCreateSchema.parse(request.body);
        const category = await app.prisma.forumCategory.findUnique({ where: { id: body.categoryId } });
        if (!category)
            fail(404, "FORUM_CATEGORY_NOT_FOUND", "Forum category was not found");
        const thread = await app.prisma.forumThread.create({
            data: {
                categoryId: category.id,
                authorUserId: user.id,
                title: body.title,
                slug: await uniqueThreadSlug(app, body.title),
                bodyMarkdown: body.bodyMarkdown
            },
            include: {
                category: true,
                author: { include: forumAuthorInclude },
                posts: { include: { author: { include: forumAuthorInclude } }, orderBy: { createdAt: "asc" } }
            }
        });
        return serializeThreadDetail(request, thread);
    });
    app.get("/api/forums/threads/:slug", async (request) => {
        const params = z.object({ slug: z.string().trim().min(1).max(180) }).parse(request.params);
        const thread = await app.prisma.forumThread.update({
            where: { slug: params.slug },
            data: { viewCount: { increment: 1 } },
            include: {
                category: true,
                author: { include: forumAuthorInclude },
                posts: {
                    include: { author: { include: forumAuthorInclude } },
                    orderBy: { createdAt: "asc" },
                    take: 250
                }
            }
        }).catch((error) => {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                fail(404, "FORUM_THREAD_NOT_FOUND", "Forum thread was not found");
            }
            throw error;
        });
        return serializeThreadDetail(request, thread);
    });
    app.post("/api/forums/threads/:id/replies", async (request) => {
        const user = requireUser(request);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        const body = replySchema.parse(request.body);
        const thread = await app.prisma.forumThread.findUnique({
            where: { id: params.id },
            select: { id: true, slug: true, title: true, isLocked: true, authorUserId: true }
        });
        if (!thread)
            fail(404, "FORUM_THREAD_NOT_FOUND", "Forum thread was not found");
        if (thread.isLocked && !isStaffRole(user.role)) {
            fail(403, "FORUM_THREAD_LOCKED", "This thread is locked");
        }
        const [post] = await app.prisma.$transaction([
            app.prisma.forumPost.create({
                data: { threadId: thread.id, authorUserId: user.id, bodyMarkdown: body.bodyMarkdown },
                include: { author: { include: forumAuthorInclude } }
            }),
            app.prisma.forumThread.update({
                where: { id: thread.id },
                data: { replyCount: { increment: 1 }, updatedAt: new Date() }
            })
        ]);
        if (thread.authorUserId !== user.id) {
            await createNotification(app, {
                userId: thread.authorUserId,
                type: "forum.reply",
                title: `${user.username} replied to your forum thread`,
                body: thread.title,
                url: `/forums/${thread.slug}`
            });
        }
        return { post: serializeForumPost(request, post) };
    });
    app.patch("/api/forums/threads/:id", async (request) => {
        const actor = requireRole(request, ["ADMIN", "MODERATOR"]);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        const body = threadPatchSchema.parse(request.body);
        const thread = await app.prisma.forumThread.update({
            where: { id: params.id },
            data: {
                ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
                ...(body.isLocked !== undefined ? { isLocked: body.isLocked } : {})
            },
            include: {
                category: true,
                author: { include: forumAuthorInclude },
                posts: { include: { author: { include: forumAuthorInclude } }, orderBy: { createdAt: "asc" } }
            }
        });
        app.io.to("admin").emit("forum:moderated", { actorId: actor.id, threadId: thread.id });
        return serializeThreadDetail(request, thread);
    });
}
async function ensureDefaultForumCategories(app) {
    const existing = await app.prisma.forumCategory.count();
    if (existing > 0)
        return;
    await app.prisma.$transaction(defaultCategories.map((category) => app.prisma.forumCategory.upsert({
        where: { slug: category.slug },
        create: category,
        update: category
    })));
}
async function uniqueThreadSlug(app, title) {
    const base = title
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 90) || "thread";
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const slug = `${base}-${nanoid(5).toLowerCase()}`;
        const exists = await app.prisma.forumThread.count({ where: { slug } });
        if (!exists)
            return slug;
    }
    return `${base}-${Date.now().toString(36)}`;
}
function serializeThreadSummary(request, thread) {
    return {
        id: thread.id,
        slug: thread.slug,
        title: thread.title,
        excerpt: thread.bodyMarkdown.replace(/[#*_`>\[\]()]/g, "").replace(/\s+/g, " ").trim().slice(0, 180),
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        replyCount: thread.replyCount,
        viewCount: thread.viewCount,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        author: serializeForumAuthor(request, thread.author)
    };
}
function serializeThreadDetail(request, thread) {
    return {
        thread: {
            id: thread.id,
            slug: thread.slug,
            title: thread.title,
            bodyMarkdown: thread.bodyMarkdown,
            isPinned: thread.isPinned,
            isLocked: thread.isLocked,
            replyCount: thread.replyCount,
            viewCount: thread.viewCount,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt,
            category: {
                id: thread.category.id,
                slug: thread.category.slug,
                name: thread.category.name
            },
            author: serializeForumAuthor(request, thread.author)
        },
        posts: thread.posts.map((post) => serializeForumPost(request, post))
    };
}
function serializeForumPost(request, post) {
    return {
        id: post.id,
        bodyMarkdown: post.bodyMarkdown,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: serializeForumAuthor(request, post.author)
    };
}
function serializeForumAuthor(request, user) {
    const avatarFile = user.profile?.files.find((file) => file.id === user.profile?.avatarFileId) ?? null;
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.profile?.displayName || user.username,
        avatar: serializeAsset(request, avatarFile)
    };
}
function isStaffRole(role) {
    return role === "OWNER" || role === "ADMIN" || role === "MODERATOR";
}
//# sourceMappingURL=forums.js.map