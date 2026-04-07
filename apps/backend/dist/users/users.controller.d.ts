import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    all(): Promise<{
        username: string;
        id: string;
        fullName: string;
        role: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    one(id: string): Promise<{
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
