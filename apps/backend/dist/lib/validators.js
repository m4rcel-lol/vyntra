import { z } from "zod";
export const passwordSchema = z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(200)
    .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Password must include at least one letter and one number"
});
export const emailSchema = z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase())
    .optional()
    .or(z.literal("").transform(() => undefined));
export const colorSchema = z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
    .optional();
export const urlSchema = z
    .string()
    .trim()
    .max(2048)
    .url()
    .refine((value) => {
    const url = new URL(value);
    return ["http:", "https:", "mailto:", "bitcoin:", "ethereum:"].includes(url.protocol);
}, "Only safe public URL protocols are allowed");
export const profileThemeSchema = z
    .object({
    fontFamily: z.string().max(80).optional(),
    fontSize: z.number().min(12).max(24).optional(),
    textColor: colorSchema,
    accentColor: colorSchema,
    cardBackground: z.string().max(40).optional(),
    cardOpacity: z.number().min(0).max(1).optional(),
    cardBlur: z.number().min(0).max(40).optional(),
    borderRadius: z.number().min(0).max(40).optional(),
    borderColor: colorSchema,
    borderGlow: z.boolean().optional(),
    avatarShape: z.enum(["circle", "rounded", "square"]).optional(),
    avatarBorder: z.boolean().optional(),
    buttonStyle: z.enum(["glass", "solid", "outline", "soft", "neon"]).optional(),
    socialIconStyle: z.enum(["circle", "square", "minimal", "glow"]).optional(),
    badgePosition: z.enum(["top", "below-name", "bottom"]).optional(),
    musicPlayerStyle: z.enum(["compact", "glass", "minimal"]).optional()
})
    .passthrough();
export const profileEffectsSchema = z
    .object({
    blurOverlay: z.boolean().optional(),
    darkOverlay: z.number().min(0).max(0.9).optional(),
    particles: z.enum(["none", "snow", "rain", "stars", "bubbles", "sparkles", "shapes"]).optional(),
    cursorTrail: z.enum(["none", "glow", "stars", "dots"]).optional(),
    entranceAnimation: z.enum(["fade", "scale", "slide", "blur", "terminal"]).optional(),
    hoverAnimation: z.enum(["lift", "glow", "scale", "none"]).optional(),
    pageTransition: z.enum(["fade", "blur", "none"]).optional(),
    backgroundAnimation: z.enum(["none", "gradient", "float", "pulse"]).optional()
})
    .passthrough();
export const metadataSchema = z
    .object({
    title: z.string().max(70).optional(),
    description: z.string().max(180).optional()
})
    .passthrough();
export const publicProfileSelect = {
    id: true,
    uid: true,
    displayName: true,
    bio: true,
    location: true,
    layout: true,
    statusText: true,
    discordPresence: true,
    musicActivity: true,
    theme: true,
    effects: true,
    metadata: true,
    embeds: true,
    sanitizedCss: true,
    clickToEnter: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
    avatarFileId: true,
    bannerFileId: true,
    backgroundFileId: true,
    audioFileId: true,
    cursorFileId: true,
    metadataFileId: true
};
//# sourceMappingURL=validators.js.map