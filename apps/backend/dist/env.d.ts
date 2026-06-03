export declare const env: {
    NODE_ENV: "development" | "test" | "production";
    PORT: number;
    PUBLIC_APP_NAME: string;
    PUBLIC_APP_URL: string;
    FRONTEND_ORIGIN: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    COOKIE_SECRET: string;
    SESSION_COOKIE_NAME: string;
    SESSION_TTL_DAYS: number;
    TRUST_PROXY: boolean;
    STORAGE_DIR: string;
    MAX_UPLOAD_MB: number;
};
export declare const isProduction: boolean;
export declare const allowedOrigins: string[];
