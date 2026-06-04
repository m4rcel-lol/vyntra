import type { Prisma, PrismaClient, UserRole } from "@prisma/client";
export type RoleBadge = Prisma.BadgeGetPayload<{
    include: {
        icon: true;
    };
}>;
export declare const roleBadgeSlugs: readonly ["owner", "staff", "moderator"];
export declare function roleBadgeSlug(role: UserRole): typeof roleBadgeSlugs[number] | null;
export declare function isOwnerRole(role: UserRole): boolean;
export declare function isRoleBadgeSlug(slug: string): boolean;
export declare function syncRoleBadgeForUser(params: {
    prisma: PrismaClient;
    userId: string;
    profileId: string | null;
    role: UserRole;
    assignedById?: string | null | undefined;
}): Promise<RoleBadge | null>;
export declare function syncRoleBadgeForUserId(params: {
    prisma: PrismaClient;
    userId: string;
    assignedById?: string | null | undefined;
}): Promise<void>;
