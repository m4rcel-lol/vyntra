import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./lib/crypto.js";
const prisma = new PrismaClient();
const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "owner";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow123!";
const globalBadges = [
    ["owner", "Owner", "#facc15", "#facc15", "Platform owner"],
    ["staff", "Staff", "#38bdf8", "#38bdf8", "Vyntra.bio staff"],
    ["moderator", "Moderator", "#22c55e", "#22c55e", "Community moderator"],
    ["verified", "Verified", "#60a5fa", "#60a5fa", "Verified identity"],
    ["early-user", "Early User", "#f472b6", "#f472b6", "Joined during the early launch"],
    ["developer", "Developer", "#a78bfa", "#a78bfa", "Builds software"],
    ["artist", "Artist", "#fb7185", "#fb7185", "Creates visual work"],
    ["musician", "Musician", "#34d399", "#34d399", "Creates music"],
    ["gamer", "Gamer", "#818cf8", "#818cf8", "Gaming profile"],
    ["partner", "Partner", "#2dd4bf", "#2dd4bf", "Community partner"],
    ["contributor", "Contributor", "#c084fc", "#c084fc", "Contributed to Vyntra.bio"],
    ["unlimited", "Unlimited", "#d4d4d4", "#ffffff", "All features unlocked for free"],
    ["custom-badge", "Custom Badge", "#f0abfc", "#f0abfc", "User-created badge support"]
];
const reserved = [
    "admin",
    "api",
    "assets",
    "dashboard",
    "editor",
    "explore",
    "files",
    "health",
    "login",
    "logout",
    "register",
    "settings",
    "templates",
    "u",
    "vyntra",
    "support",
    "security"
];
async function main() {
    const passwordHash = await hashPassword(adminPassword);
    const admin = await prisma.user.upsert({
        where: { username: adminUsername.toLowerCase() },
        create: {
            username: adminUsername.toLowerCase(),
            email: adminEmail.toLowerCase(),
            passwordHash,
            role: "ADMIN",
            profile: {
                create: {
                    displayName: "Vyntra Owner",
                    bio: "Self-hosted creator identity, without locked premium tiers.",
                    location: "Vyntra.bio",
                    layout: "centered-glass",
                    theme: {
                        accentColor: "#d8d8d8",
                        textColor: "#ffffff",
                        cardOpacity: 0.72,
                        cardBlur: 24,
                        borderGlow: true
                    },
                    effects: {
                        particles: "stars",
                        entranceAnimation: "scale",
                        hoverAnimation: "lift",
                        backgroundAnimation: "gradient"
                    },
                    metadata: {
                        title: "Vyntra.bio Owner",
                        description: "A creator profile powered by Vyntra.bio"
                    },
                    links: {
                        create: [
                            {
                                title: "Vyntra.bio",
                                url: "https://example.com",
                                kind: "website",
                                order: 0
                            },
                            {
                                title: "GitHub",
                                url: "https://github.com",
                                kind: "github",
                                order: 1
                            }
                        ]
                    }
                }
            }
        },
        update: {
            email: adminEmail.toLowerCase(),
            role: "ADMIN"
        },
        include: { profile: true }
    });
    for (const [slug, name, color, glowColor, tooltip] of globalBadges) {
        await prisma.badge.upsert({
            where: { slug },
            create: {
                slug,
                name,
                color,
                glowColor,
                tooltip,
                description: tooltip,
                isGlobal: true
            },
            update: {
                name,
                color,
                glowColor,
                tooltip,
                description: tooltip,
                isGlobal: true
            }
        });
    }
    for (const name of reserved) {
        await prisma.reservedUsername.upsert({
            where: { normalized: name },
            create: {
                name,
                normalized: name,
                reason: "route or platform namespace",
                createdById: admin.id
            },
            update: {
                reason: "route or platform namespace",
                createdById: admin.id
            }
        });
    }
    const ownerBadge = await prisma.badge.findUnique({ where: { slug: "owner" } });
    const unlimitedBadge = await prisma.badge.findUnique({ where: { slug: "unlimited" } });
    if (admin.profile && ownerBadge && unlimitedBadge) {
        await prisma.userBadge.createMany({
            data: [
                { profileId: admin.profile.id, badgeId: ownerBadge.id, assignedById: admin.id, order: 0 },
                { profileId: admin.profile.id, badgeId: unlimitedBadge.id, assignedById: admin.id, order: 1 }
            ],
            skipDuplicates: true
        });
    }
    await prisma.announcement.upsert({
        where: { id: "seed-welcome-announcement" },
        create: {
            id: "seed-welcome-announcement",
            title: "Welcome to Vyntra.bio",
            body: "Every customization, badge, template, and analytics feature is available for free.",
            tone: "success",
            createdById: admin.id
        },
        update: {
            isActive: true,
            title: "Welcome to Vyntra.bio",
            body: "Every customization, badge, template, and analytics feature is available for free."
        }
    });
    console.log(`Seeded admin user: ${admin.username}`);
}
main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map