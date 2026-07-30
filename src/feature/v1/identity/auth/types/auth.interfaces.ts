import { Types } from "mongoose";

export interface IAuth {
    userId: Types.ObjectId;
    password: string;
    lastLogin: Date | null;
    lastLogout: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
