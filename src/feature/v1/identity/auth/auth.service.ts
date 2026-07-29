import UserModel from "../user/user.model";
import bcrypt from "bcryptjs";
import { RegisterData } from "./types/auth.types";
import AuthModel from "./auth.model";
import mongoose from "mongoose";
import { ConflictError } from "../../../../common/errorStatusCode";

export const registerService = async ({
    username,
    email,
    password,
}: RegisterData) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const existing = await UserModel.findOne({
            $or: [{ username }, { email }],
        }).session(session);

        if (existing) {
            if (existing.username === username) {
                throw new ConflictError("Username already exists");
            }
            throw new ConflictError("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [user] = await UserModel.create([{ username, email }], {
            session,
        });
        await AuthModel.create(
            [{ userId: user._id, password: hashedPassword }],
            { session }
        );

        await session.commitTransaction();

        return {
            id: user._id,
            username: user.username,
            email: user.email,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
