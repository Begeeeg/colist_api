import { userRole } from "./user.enums";

export interface IUser {
    username: string;
    email: string;
    avatarUrl?: string;
    isActive: boolean;
    role: userRole;
    createdAt: Date;
    updatedAt: Date;
}
