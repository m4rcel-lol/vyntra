export declare function sha256(value: string): string;
export declare function hashIp(ip: string): string;
export declare function hashVisitor(seed: string): string;
export declare function createSessionToken(): string;
export declare function createCsrfToken(): string;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(hash: string, password: string): Promise<boolean>;
export declare function constantTimeEqual(left: string, right: string): boolean;
