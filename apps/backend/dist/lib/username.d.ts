import { z } from "zod";
export declare const reservedRoutes: Set<string>;
export declare const usernameSchema: z.ZodEffects<z.ZodString, string, string>;
export declare function normalizeUsername(value: string): string;
export declare function isRouteReserved(username: string): boolean;
