import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            username: string;
            fullName: string;
            role: string;
        };
    }>;
    getProfile(req: any): Promise<{
        username: string;
        id: string;
        fullName: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
    }>;
}
