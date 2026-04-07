import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
export declare class CategoriesController {
    private service;
    constructor(service: CategoriesService);
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
    create(dto: CreateCategoryDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateCategoryDto): Promise<{
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
