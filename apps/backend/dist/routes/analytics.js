import { z } from "zod";
import { requireUser } from "../lib/auth.js";
import { fail } from "../lib/errors.js";
const DAY_MS = 24 * 60 * 60 * 1000;
const rangeQuerySchema = z.object({
    range: z.enum(["7d", "30d", "90d"]).default("30d")
});
const rangeDays = {
    "7d": 7,
    "30d": 30,
    "90d": 90
};
export async function registerAnalyticsRoutes(app) {
    app.get("/api/analytics/summary", async (request) => {
        const user = requireUser(request);
        if (!user.profileId)
            fail(404, "PROFILE_NOT_FOUND", "Profile was not found");
        const query = rangeQuerySchema.parse(request.query);
        const days = rangeDays[query.range];
        const periodEnd = new Date();
        const since = new Date(periodEnd.getTime() - days * DAY_MS);
        const previousSince = new Date(since.getTime() - days * DAY_MS);
        const viewWhere = { profileId: user.profileId, createdAt: { gte: since } };
        const previousViewWhere = { profileId: user.profileId, createdAt: { gte: previousSince, lt: since } };
        const clickWhere = { profileId: user.profileId, createdAt: { gte: since } };
        const previousClickWhere = { profileId: user.profileId, createdAt: { gte: previousSince, lt: since } };
        const eventWhere = { profileId: user.profileId, createdAt: { gte: since } };
        const [totalViews, previousViews, uniqueVisitors, previousUniqueVisitors, linkClicks, previousLinkClicks, templateImports, fileViews, topReferrers, devices, browsers, countries, profileLinks, linkClickCounts] = await Promise.all([
            app.prisma.profileView.count({ where: viewWhere }),
            app.prisma.profileView.count({ where: previousViewWhere }),
            app.prisma.profileView.findMany({
                where: viewWhere,
                distinct: ["visitorHash"],
                select: { visitorHash: true }
            }),
            app.prisma.profileView.findMany({
                where: previousViewWhere,
                distinct: ["visitorHash"],
                select: { visitorHash: true }
            }),
            app.prisma.linkClick.count({ where: clickWhere }),
            app.prisma.linkClick.count({ where: previousClickWhere }),
            app.prisma.analyticsEvent.count({
                where: { ...eventWhere, type: "TEMPLATE_IMPORT" }
            }),
            app.prisma.analyticsEvent.count({
                where: { ...eventWhere, type: { in: ["FILE_VIEW", "FILE_DOWNLOAD"] } }
            }),
            app.prisma.profileView.groupBy({
                by: ["referrer"],
                where: { ...viewWhere, referrer: { not: "" } },
                _count: true,
                orderBy: { _count: { referrer: "desc" } },
                take: 10
            }),
            app.prisma.profileView.groupBy({
                by: ["device"],
                where: viewWhere,
                _count: true,
                orderBy: { _count: { device: "desc" } }
            }),
            app.prisma.profileView.groupBy({
                by: ["browser"],
                where: viewWhere,
                _count: true,
                orderBy: { _count: { browser: "desc" } },
                take: 10
            }),
            app.prisma.profileView.groupBy({
                by: ["country"],
                where: { ...viewWhere, country: { not: "" } },
                _count: true,
                orderBy: { _count: { country: "desc" } },
                take: 10
            }),
            app.prisma.link.findMany({
                where: { profileId: user.profileId },
                select: { id: true, title: true, kind: true }
            }),
            app.prisma.linkClick.groupBy({
                by: ["linkId"],
                where: clickWhere,
                _count: { _all: true }
            })
        ]);
        const [viewsOverTime, visitorsOverTime, clicksOverTime, templateImportsOverTime] = await Promise.all([
            app.prisma.$queryRaw `
        SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS views
        FROM "ProfileView"
        WHERE "profileId" = ${user.profileId} AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
            app.prisma.$queryRaw `
        SELECT date_trunc('day', "createdAt") AS day, count(DISTINCT "visitorHash")::bigint AS visitors
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
      `,
            app.prisma.$queryRaw `
        SELECT date_trunc('day', "createdAt") AS day, count(*)::bigint AS imports
        FROM "AnalyticsEvent"
        WHERE "profileId" = ${user.profileId}
          AND "createdAt" >= ${since}
          AND "type"::text = 'TEMPLATE_IMPORT'
        GROUP BY day
        ORDER BY day ASC
      `
        ]);
        const currentCtr = totalViews > 0 ? (linkClicks / totalViews) * 100 : 0;
        const previousCtr = previousViews > 0 ? (previousLinkClicks / previousViews) * 100 : 0;
        const clickCountByLinkId = new Map(linkClickCounts.map((item) => [item.linkId, getCount(item._count, "_all")]));
        const links = profileLinks
            .map((link) => ({
            ...link,
            clickCount: clickCountByLinkId.get(link.id) ?? 0
        }))
            .filter((link) => link.clickCount > 0)
            .sort((a, b) => b.clickCount - a.clickCount);
        return {
            range: query.range,
            days,
            totals: {
                profileViews: totalViews,
                uniqueVisitors: uniqueVisitors.length,
                linkClicks,
                templateImports,
                fileViews,
                ctr: Number(currentCtr.toFixed(1)),
                deltas: {
                    profileViews: percentDelta(totalViews, previousViews),
                    uniqueVisitors: percentDelta(uniqueVisitors.length, previousUniqueVisitors.length),
                    linkClicks: percentDelta(linkClicks, previousLinkClicks),
                    ctr: percentDelta(currentCtr, previousCtr)
                }
            },
            viewsOverTime: viewsOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                views: Number(row.views)
            })),
            visitorsOverTime: visitorsOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                visitors: Number(row.visitors)
            })),
            clicksOverTime: clicksOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                clicks: Number(row.clicks)
            })),
            templateImportsOverTime: templateImportsOverTime.map((row) => ({
                day: row.day.toISOString().slice(0, 10),
                imports: Number(row.imports)
            })),
            topReferrers: topReferrers.map((item) => ({ referrer: item.referrer, count: getCount(item._count, "referrer") })),
            devices: devices.map((item) => ({ device: item.device || "unknown", count: getCount(item._count, "device") })),
            browsers: browsers.map((item) => ({ browser: item.browser || "unknown", count: getCount(item._count, "browser") })),
            countries: countries
                .filter((item) => item.country.trim().length > 0)
                .map((item) => ({ country: item.country, count: getCount(item._count, "country") })),
            links
        };
    });
}
function percentDelta(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
}
function getCount(value, key) {
    return typeof value === "number" ? value : value[key] ?? 0;
}
//# sourceMappingURL=analytics.js.map