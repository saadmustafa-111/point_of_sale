import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        username: string;
        id: string;
        fullName: string;
        role: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        username: string;
        id: string;
        email: string | null;
        fullName: string;
        role: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateUserDto): Promise<{
        username: string;
        id: string;
        email: string | null;
        fullName: string;
        role: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        username: string;
        id: string;
        email: string | null;
        fullName: string;
        role: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        username: string;
        password: string;
        id: string;
        email: string | null;
        fullName: string;
        role: string;
        phone: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
