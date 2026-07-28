import { Types } from "mongoose";

export interface IAuth {
    userId: Types.ObjectId;
    password: string;
    lastLogin?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
