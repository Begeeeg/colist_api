import { Schema, model, Types } from "mongoose";
import { IAuth } from "./types/auth.interfaces";

const AuthSchema = new Schema<IAuth>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        lastLogin: {
            type: Date,
        },
        lastLogout: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const AuthModel = model<IAuth>("Auth", AuthSchema);

export default AuthModel;
