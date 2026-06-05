import { z } from "zod";
export const reservedRoutes = new Set([
    "admin",
    "analytics",
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
    "u"
]);
export const usernameSchema = z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*[a-zA-Z0-9_]$/, {
    message: "Username must use letters, numbers, dots, dashes, or underscores and cannot end with punctuation"
})
    .transform((value) => value.toLowerCase());
export function normalizeUsername(value) {
    return usernameSchema.parse(value);
}
export function isRouteReserved(username) {
    return reservedRoutes.has(username.toLowerCase());
}
//# sourceMappingURL=username.js.map