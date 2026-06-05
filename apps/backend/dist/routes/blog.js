import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole, requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
import { serializeAsset } from "../lib/serialize.js";
const markdownLimit = 60_000;
const blogCreateSchema = z.object({
    title: z.string().trim().min(1).max(140),
    slug: z.string().trim().min(2).max(90).regex(/^[a-z0-9-]+$/).optional(),
    excerpt: z.string().trim().max(280).default(""),
    contentMarkdown: z.string().trim().min(1).max(markdownLimit),
    isPublished: z.boolean().default(true),
    isPinned: z.boolean().default(false)
});
const blogUpdateSchema = blogCreateSchema.partial();
const blogPinSchema = z.object({
    isPinned: z.boolean()
});
export async function registerBlogRoutes(app) {
    app.get("/api/blog", async (request) => {
        const posts = await app.prisma.blogPost.findMany({
            where: readablePostWhere(request),
            orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
            take: 50,
            include: blogPostInclude()
        });
        const likedIds = await likedPostIds(app, request, posts.map((post) => post.id));
        return {
            posts: posts.map((post) => serializeBlogPost(request, post, likedIds.has(post.id), false)),
            canManage: canManageBlog(request)
        };
    });
    app.get("/api/blog/:slug", async (request) => {
        const params = z.object({ slug: z.string().min(1).max(100) }).parse(request.params);
        const post = await app.prisma.blogPost.findUnique({
            where: { slug: params.slug },
            include: blogPostInclude()
        });
        if (!post || (!post.isPublished && !canManageBlog(request))) {
            fail(404, "BLOG_POST_NOT_FOUND", "Blog post was not found");
        }
        const likedIds = await likedPostIds(app, request, [post.id]);
        return {
            post: serializeBlogPost(request, post, likedIds.has(post.id), true),
            canManage: canManageBlog(request)
        };
    });
    app.post("/api/blog", async (request) => {
        const actor = requireRole(request, ["ADMIN"]);
        const body = blogCreateSchema.parse(request.body);
        const slug = await uniqueBlogSlug(app, body.slug || body.title);
        const post = await app.prisma.blogPost.create({
            data: {
                authorUserId: actor.id,
                slug,
                title: body.title,
                excerpt: body.excerpt || excerptFromMarkdown(body.contentMarkdown),
                contentMarkdown: body.contentMarkdown,
                isPublished: body.isPublished,
                isPinned: body.isPinned,
                publishedAt: body.isPublished ? new Date() : null
            },
            include: blogPostInclude()
        });
        return { post: serializeBlogPost(request, post, false, true) };
    });
    app.patch("/api/blog/:id", async (request) => {
        requireRole(request, ["ADMIN"]);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        const body = blogUpdateSchema.parse(request.body);
        const existing = await app.prisma.blogPost.findUnique({ where: { id: params.id } });
        if (!existing)
            fail(404, "BLOG_POST_NOT_FOUND", "Blog post was not found");
        const updateData = {};
        if (body.title !== undefined)
            updateData.title = body.title;
        if (body.slug !== undefined)
            updateData.slug = await uniqueBlogSlug(app, body.slug, existing.id);
        if (body.excerpt !== undefined)
            updateData.excerpt = body.excerpt;
        if (body.contentMarkdown !== undefined) {
            updateData.contentMarkdown = body.contentMarkdown;
            if (body.excerpt === undefined && !existing.excerpt) {
                updateData.excerpt = excerptFromMarkdown(body.contentMarkdown);
            }
        }
        if (body.isPinned !== undefined)
            updateData.isPinned = body.isPinned;
        if (body.isPublished !== undefined) {
            updateData.isPublished = body.isPublished;
            updateData.publishedAt = body.isPublished ? existing.publishedAt ?? new Date() : null;
        }
        const post = await app.prisma.blogPost.update({
            where: { id: params.id },
            data: updateData,
            include: blogPostInclude()
        });
        const likedIds = await likedPostIds(app, request, [post.id]);
        return { post: serializeBlogPost(request, post, likedIds.has(post.id), true) };
    });
    app.post("/api/blog/:id/pin", async (request) => {
        requireRole(request, ["ADMIN"]);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        const body = blogPinSchema.parse(request.body);
        const post = await app.prisma.blogPost.update({
            where: { id: params.id },
            data: { isPinned: body.isPinned },
            include: blogPostInclude()
        }).catch((error) => {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                fail(404, "BLOG_POST_NOT_FOUND", "Blog post was not found");
            }
            throw error;
        });
        const likedIds = await likedPostIds(app, request, [post.id]);
        return { post: serializeBlogPost(request, post, likedIds.has(post.id), true) };
    });
    app.delete("/api/blog/:id", async (request) => {
        requireRole(request, ["ADMIN"]);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        await app.prisma.blogPost.delete({ where: { id: params.id } }).catch((error) => {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                fail(404, "BLOG_POST_NOT_FOUND", "Blog post was not found");
            }
            throw error;
        });
        return { ok: true };
    });
    app.post("/api/blog/:id/like", async (request) => {
        const user = requireUser(request);
        const params = z.object({ id: z.string().cuid() }).parse(request.params);
        const post = await app.prisma.blogPost.findUnique({
            where: { id: params.id },
            select: { id: true, isPublished: true }
        });
        if (!post || !post.isPublished)
            fail(404, "BLOG_POST_NOT_FOUND", "Blog post was not found");
        const existing = await app.prisma.blogPostLike.findUnique({
            where: { postId_userId: { postId: post.id, userId: user.id } },
            select: { id: true }
        });
        if (existing) {
            await app.prisma.blogPostLike.delete({ where: { id: existing.id } });
        }
        else {
            await app.prisma.blogPostLike.create({ data: { postId: post.id, userId: user.id } });
        }
        const likeCount = await app.prisma.blogPostLike.count({ where: { postId: post.id } });
        await app.prisma.blogPost.update({ where: { id: post.id }, data: { likeCount } });
        return { ok: true, liked: !existing, likeCount };
    });
}
function readablePostWhere(request) {
    return canManageBlog(request) ? {} : { isPublished: true };
}
function canManageBlog(request) {
    return request.currentUser?.role === "OWNER" || request.currentUser?.role === "ADMIN";
}
function blogPostInclude() {
    return {
        author: {
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                profile: {
                    select: {
                        id: true,
                        displayName: true,
                        avatarFileId: true,
                        files: {
                            where: { deletedAt: null, kind: "AVATAR" }
                        }
                    }
                }
            }
        }
    };
}
function serializeBlogPost(request, post, likedByMe, includeContent) {
    const profile = post.author.profile;
    const fileById = new Map((profile?.files ?? []).map((file) => [file.id, file]));
    return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || excerptFromMarkdown(post.contentMarkdown),
        contentMarkdown: includeContent ? post.contentMarkdown : undefined,
        isPublished: post.isPublished,
        isPinned: post.isPinned,
        likeCount: post.likeCount,
        likedByMe,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author: {
            id: post.author.id,
            username: post.author.username,
            role: post.author.role,
            displayName: profile?.displayName || post.author.username,
            avatar: serializeAsset(request, profile?.avatarFileId ? fileById.get(profile.avatarFileId) : null)
        }
    };
}
async function likedPostIds(app, request, postIds) {
    if (!request.currentUser || postIds.length === 0)
        return new Set();
    const likes = await app.prisma.blogPostLike.findMany({
        where: { userId: request.currentUser.id, postId: { in: postIds } },
        select: { postId: true }
    });
    return new Set(likes.map((like) => like.postId));
}
async function uniqueBlogSlug(app, input, ignoreId) {
    const base = slugify(input);
    for (let suffix = 0; suffix < 40; suffix += 1) {
        const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
        const existing = await app.prisma.blogPost.findUnique({
            where: { slug: candidate },
            select: { id: true }
        });
        if (!existing || existing.id === ignoreId)
            return candidate;
    }
    return `${base}-${randomBytes(4).toString("hex")}`;
}
function slugify(input) {
    const slug = input
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
    return slug || "post";
}
function excerptFromMarkdown(markdown) {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/[#>*_`[\]()!-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 220);
}
//# sourceMappingURL=blog.js.map