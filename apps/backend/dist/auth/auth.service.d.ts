import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            fullName: string;
            role: string;
        };
    }>;
    getProfile(userId: string): Promise<{
        username: string;
        id: string;
        fullName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }>;
}
