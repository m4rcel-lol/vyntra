export const roleBadgeSlugs = ["owner", "staff", "moderator"];
const badgeSlugByRole = {
    OWNER: "owner",
    ADMIN: "staff",
    MODERATOR: "moderator"
};
export function roleBadgeSlug(role) {
    return badgeSlugByRole[role] ?? null;
}
export function isOwnerRole(role) {
    return role === "OWNER";
}
export function isRoleBadgeSlug(slug) {
    return roleBadgeSlugs.includes(slug.toLowerCase());
}
export async function syncRoleBadgeForUser(params) {
    if (!params.profileId)
        return null;
    const desiredSlug = roleBadgeSlug(params.role);
    const badges = await params.prisma.badge.findMany({
        where: { slug: { in: [...roleBadgeSlugs] } },
        include: { icon: true }
    });
    const desiredBadge = desiredSlug ? badges.find((badge) => badge.slug === desiredSlug) ?? null : null;
    await params.prisma.userBadge.deleteMany({
        where: {
            profileId: params.profileId,
            badge: { slug: { in: [...roleBadgeSlugs] } },
            ...(desiredBadge ? { badgeId: { not: desiredBadge.id } } : {})
        }
    });
    if (!desiredBadge)
        return null;
    await params.prisma.userBadge.upsert({
        where: {
            profileId_badgeId: {
                profileId: params.profileId,
                badgeId: desiredBadge.id
            }
        },
        create: {
            profileId: params.profileId,
            badgeId: desiredBadge.id,
            assignedById: params.assignedById ?? params.userId,
            order: roleBadgeOrder(params.role)
        },
        update: {
            assignedById: params.assignedById ?? params.userId,
            order: roleBadgeOrder(params.role)
        }
    });
    return desiredBadge;
}
export async function syncRoleBadgeForUserId(params) {
    const user = await params.prisma.user.findUnique({
        where: { id: params.userId },
        select: {
            id: true,
            role: true,
            profile: { select: { id: true } }
        }
    });
    if (!user)
        return;
    await syncRoleBadgeForUser({
        prisma: params.prisma,
        userId: user.id,
        profileId: user.profile?.id ?? null,
        role: user.role,
        assignedById: params.assignedById
    });
}
function roleBadgeOrder(role) {
    if (role === "OWNER")
        return -300;
    if (role === "ADMIN")
        return -200;
    if (role === "MODERATOR")
        return -100;
    return 0;
}
//# sourceMappingURL=role-badges.js.map