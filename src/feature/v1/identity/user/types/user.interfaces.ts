import { userRole } from "./user.enums";

export interface IUser {
    username: string;
    email: string;
    avatarUrl?: string;
    isOnline: boolean;
    role: userRole;
    createdAt: Date;
    updatedAt: Date;
}
