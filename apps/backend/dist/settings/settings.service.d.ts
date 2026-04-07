import { PrismaService } from '../prisma/prisma.service';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
    get(key: string): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    upsert(key: string, value: string): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    upsertMany(entries: {
        key: string;
        value: string;
    }[]): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
}
