import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<{
    log: ("info" | "query" | "warn" | "error")[];
}, "info" | "query" | "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
