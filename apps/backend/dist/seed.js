import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./lib/crypto.js";
import { syncRoleBadgeForUserId } from "./lib/role-badges.js";
const prisma = new PrismaClient();
const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "owner";
const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "owner@example.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeNow123!";
const ownerBio = "Self-hosted creator identity, without locked feature tiers.";
const protectedOwnerUsernames = Array.from(new Set([adminUsername, "owner", "m5rcel"].map((name) => name.toLowerCase())));
const normalizedAdminUsername = adminUsername.toLowerCase();
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
    ["unlimited", "Unlimited", "#d4d4d4", "#ffffff", "All features unlocked for free"]
];
const reserved = [
    "admin",
    "api",
    "assets",
    "blog",
    "dashboard",
    "editor",
    "explore",
    "files",
    "health",
    "login",
    "logout",
    "perks",
    "register",
    "settings",
    "templates",
    "u",
    "vyntra",
    "support",
    "security"
];
async function main() {
    const existingAdmin = await prisma.user.findUnique({
        where: { username: normalizedAdminUsername },
        include: { profile: true }
    });
    const passwordHash = await hashPassword(adminPassword);
    const admin = await prisma.user.upsert({
        where: { username: normalizedAdminUsername },
        create: {
            username: normalizedAdminUsername,
            email: adminEmail.toLowerCase(),
            passwordHash,
            role: "OWNER",
            profile: {
                create: {
                    displayName: "Vyntra Owner",
                    bio: ownerBio,
                    location: "Vyntra.bio",
                    layout: "minimal-text",
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
            role: "OWNER"
        },
        include: { profile: true }
    });
    const adminProfile = admin.profile ?? await prisma.profile.create({
        data: {
            userId: admin.id,
            displayName: admin.username,
            bio: ownerBio,
            location: "Vyntra.bio",
            layout: "minimal-text",
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
                title: `${admin.username} on Vyntra.bio`,
                description: "A creator profile powered by Vyntra.bio"
            }
        }
    });
    if (adminProfile && !existingAdmin?.profile && admin.profile) {
        await prisma.profile.update({
            where: { id: adminProfile.id },
            data: {
                displayName: "Vyntra Owner",
                bio: ownerBio,
                location: "Vyntra.bio",
                layout: "minimal-text",
                statusText: ""
            }
        });
    }
    if (adminProfile) {
        const starterSnapshot = {
            layout: "minimal-text",
            statusText: "",
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
                title: "Monochrome Starter",
                description: "A clean dark Vyntra.bio profile template"
            },
            embeds: [],
            customCss: "",
            clickToEnter: true,
            links: [
                { title: "Vyntra.bio", url: "https://example.com", kind: "website", order: 0, isVisible: true, style: {} },
                { title: "GitHub", url: "https://github.com", kind: "github", order: 1, isVisible: true, style: {} }
            ],
            badges: [
                { name: "Owner", color: "#facc15", glowColor: "#facc15", tooltip: "Platform owner" },
                { name: "Unlimited", color: "#d4d4d4", glowColor: "#ffffff", tooltip: "All features unlocked for free" }
            ]
        };
        const existingTemplate = await prisma.template.findFirst({
            where: { ownerUserId: admin.id, name: "Monochrome Starter" }
        });
        const starterTemplateData = {
            ownerUserId: admin.id,
            name: "Monochrome Starter",
            description: "A polished black, white, and glass profile starter for self-hosted creators.",
            style: "dark",
            tags: ["dark", "clean", "portfolio"],
            isPublished: true,
            snapshot: starterSnapshot
        };
        if (existingTemplate) {
            await prisma.template.update({
                where: { id: existingTemplate.id },
                data: starterTemplateData
            });
        }
        else {
            await prisma.template.create({ data: starterTemplateData });
        }
    }
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
    await prisma.badge.deleteMany({ where: { slug: "custom-badge" } });
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
    const unlimitedBadge = await prisma.badge.findUnique({ where: { slug: "unlimited" } });
    await prisma.user.updateMany({
        where: { username: { in: protectedOwnerUsernames } },
        data: { role: "OWNER" }
    });
    const roleUsers = await prisma.user.findMany({
        where: { role: { in: ["OWNER", "ADMIN", "MODERATOR"] } },
        select: { id: true }
    });
    for (const roleUser of roleUsers) {
        await syncRoleBadgeForUserId({ prisma, userId: roleUser.id, assignedById: admin.id });
    }
    if (adminProfile && unlimitedBadge) {
        await prisma.userBadge.createMany({
            data: [
                { profileId: adminProfile.id, badgeId: unlimitedBadge.id, assignedById: admin.id, order: 1 }
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
    const existingWelcomePost = await prisma.blogPost.findUnique({
        where: { slug: "welcome-to-vyntra" },
        select: { id: true }
    });
    if (!existingWelcomePost) {
        await prisma.blogPost.create({
            data: {
                authorUserId: admin.id,
                slug: "welcome-to-vyntra",
                title: "Welcome to Vyntra.bio",
                excerpt: "What the self-hosted Vyntra.bio blog is for, and how staff can use it for updates.",
                contentMarkdown: `# Welcome to Vyntra.bio

This blog is the public update feed for your self-hosted Vyntra instance.

Staff and owners can publish posts, pin important announcements, and write in **Markdown**. Users can like posts when they are logged in.

## What to post here

- Product updates and changelogs
- Community announcements
- Self-hosting notes
- Moderation and safety updates

> Keep posts clear, useful, and easy to scan.`,
                isPublished: true,
                isPinned: true,
                publishedAt: new Date()
            }
        });
    }
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