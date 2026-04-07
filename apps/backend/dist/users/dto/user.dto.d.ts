import { Role } from '../../common/enums';
export declare class CreateUserDto {
    username: string;
    fullName: string;
    email?: string;
    password: string;
    role: Role;
    phone?: string;
}
export declare class UpdateUserDto {
    fullName?: string;
    email?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
    phone?: string;
}
