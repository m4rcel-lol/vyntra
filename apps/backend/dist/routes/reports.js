import { ReportTargetType } from "@prisma/client";
import { z } from "zod";
import { fail } from "../lib/errors.js";
const reportSchema = z.object({
    targetType: z.nativeEnum(ReportTargetType),
    targetId: z.string().min(3).max(120),
    reason: z.string().trim().min(3).max(80),
    details: z.string().trim().max(1000).default("")
});
export async function registerReportRoutes(app) {
    app.post("/api/reports", async (request) => {
        const body = reportSchema.parse(request.body);
        await assertTargetExists(app, body.targetType, body.targetId);
        const data = {
            targetType: body.targetType,
            targetId: body.targetId,
            reason: body.reason,
            details: body.details
        };
        if (request.currentUser?.id)
            data.reporterUserId = request.currentUser.id;
        const report = await app.prisma.report.create({
            data
        });
        app.io.to("admin").emit("moderation:report", { reportId: report.id });
        return { report };
    });
}
async function assertTargetExists(app, targetType, targetId) {
    if (targetType === "PROFILE") {
        const count = await app.prisma.profile.count({ where: { id: targetId } });
        if (count > 0)
            return;
    }
    if (targetType === "TEMPLATE") {
        const count = await app.prisma.template.count({ where: { id: targetId } });
        if (count > 0)
            return;
    }
    if (targetType === "FILE") {
        const count = await app.prisma.fileAsset.count({ where: { id: targetId } });
        if (count > 0)
            return;
    }
    if (targetType === "USER") {
        const count = await app.prisma.user.count({ where: { id: targetId } });
        if (count > 0)
            return;
    }
    fail(404, "REPORT_TARGET_NOT_FOUND", "Reported target was not found");
}
//# sourceMappingURL=reports.js.map