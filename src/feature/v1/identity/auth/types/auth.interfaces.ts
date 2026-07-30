import { Types } from "mongoose";

export interface IAuth {
    userId: Types.ObjectId;
    password: string;
    lastLogin: Date;
    lastLogout: Date;
    createdAt: Date;
    updatedAt: Date;
}
