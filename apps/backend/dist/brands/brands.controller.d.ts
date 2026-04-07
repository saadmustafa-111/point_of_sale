import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
export declare class BrandsController {
    private service;
    constructor(service: BrandsService);
    all(): import(".prisma/client").Prisma.PrismaPromise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    one(id: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateBrandDto): import(".prisma/client").Prisma.Prisma__BrandClient<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    update(id: string, dto: UpdateBrandDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
