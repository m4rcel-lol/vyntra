import { requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
export async function registerDashboardRoutes(app) {
    app.get("/api/dashboard", async (request) => {
        const user = requireUser(request);
        if (!user.profileId)
            fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
        const [profile, recentViews, recentClicks, announcements, fileCount, templateCount] = await Promise.all([
            app.prisma.profile.findUnique({
                where: { id: user.profileId },
                include: {
                    links: { orderBy: { order: "asc" } },
                    badges: { include: { badge: true }, orderBy: { order: "asc" } }
                }
            }),
            app.prisma.profileView.findMany({
                where: { profileId: user.profileId },
                orderBy: { createdAt: "desc" },
                take: 8
            }),
            app.prisma.linkClick.findMany({
                where: { profileId: user.profileId },
                include: { link: { select: { title: true, kind: true } } },
                orderBy: { createdAt: "desc" },
                take: 8
            }),
            app.prisma.announcement.findMany({
                where: {
                    isActive: true,
                    OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
                    AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }]
                },
                orderBy: { createdAt: "desc" },
                take: 3
            }),
            app.prisma.fileAsset.count({ where: { ownerUserId: user.id, deletedAt: null } }),
            app.prisma.template.count({ where: { ownerUserId: user.id } })
        ]);
        if (!profile)
            fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
        return {
            user,
            profile,
            stats: {
                views: profile.viewCount,
                links: profile.links.length,
                badges: profile.badges.length,
                files: fileCount,
                templates: templateCount
            },
            checklist: [
                { key: "avatar", label: "Upload an avatar", done: Boolean(profile.avatarFileId) },
                { key: "bio", label: "Write a bio", done: profile.bio.trim().length > 0 },
                { key: "links", label: "Add at least three links", done: profile.links.length >= 3 },
                { key: "theme", label: "Customize your theme", done: Object.keys(profile.theme).length > 0 },
                { key: "template", label: "Save a reusable template", done: templateCount > 0 }
            ],
            recentViews,
            recentClicks,
            announcements
        };
    });
}
//# sourceMappingURL=dashboard.js.map