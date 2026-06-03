import { requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
export async function registerAnalyticsRoutes(app) {
    app.get("/api/analytics/summary", async (request) => {
        const user = requireUser(request);
        if (!user.profileId)
            fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totalViews, uniqueVisitors, linkClicks, templateImports, fileViews, topReferrers, devices, browsers, countries, links] = await Promise.all([
            app.prisma.profileView.count({ where: { profileId: user.profileId } }),
            app.prisma.profileView.findMany({
                where: { profileId: user.profileId },
                distinct: ["visitorHash"],
                select: { visitorHash: true }
            }),
            app.prisma.linkClick.count({ where: { profileId: user.profileId } }),
            app.prisma.analyticsEvent.count({
                where: { profileId: user.profileId, type: "TEMPLATE_IMPORT" }
            }),
            app.prisma.analyticsEvent.count({
                where: { profileId: user.profileId, type: { in: ["FILE_VIEW", "FILE_DOWNLOAD"] } }
            }),
            app.prisma.profileView.groupBy({
                by: ["referrer"],
                where: { profileId: user.profileId, referrer: { not: "" } },
                _count: true,
                orderBy: { _count: { referrer: "desc" } },
                take: 10
            }),
            app.prisma.profileView.groupBy({
                by: ["device"],
                where: { profileId: user.profileId },
                _count: true,
                orderBy: { _count: { device: "desc" } }
            }),
            app.prisma.profileView.groupBy({
                by: ["browser"],
                where: { profileId: user.profileId },
                _count: true,
                orderBy: { _count: { browser: "desc" } },
                take: 10
            }),
            app.prisma.profileView.groupBy({
                by: ["country"],
                where: { profileId: user.profileId, country: { not: "" } },
                _count: true,
                orderBy: { _count: { country: "desc" } },
                take: 10
            }),
            app.prisma.link.findMany({
                where: { profileId: user.profileId },
                orderBy: { clickCount: "desc" },
                select: { id: true, title: true, kind: true, clickCount: true }
            })
        ]);
        const [viewsOverTime, clicksOverTime] = await Promise.all([
            app.prisma.$queryRaw `
        SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS views
        FROM "ProfileView"
        WHERE "profileId" = ${user.profileId} AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
            app.prisma.$queryRaw `
        SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS clicks
        FROM "LinkClick"
        WHERE "profileId" = ${user.profileId} AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `
        ]);
        return {
            totals: {
                profileViews: totalViews,
                uniqueVisitors: uniqueVisitors.length,
                linkClicks,
                templateImports,
                fileViews
            },
            viewsOverTime: viewsOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                views: Number(row.views)
            })),
            clicksOverTime: clicksOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                clicks: Number(row.clicks)
            })),
            topReferrers: topReferrers.map((item) => ({ referrer: item.referrer, count: item._count })),
            devices: devices.map((item) => ({ device: item.device || "unknown", count: item._count })),
            browsers: browsers.map((item) => ({ browser: item.browser || "unknown", count: item._count })),
            countries: countries.map((item) => ({ country: item.country, count: item._count })),
            links
        };
    });
}
//# sourceMappingURL=analytics.js.map