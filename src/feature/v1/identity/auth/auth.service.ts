import UserModel from "../user/user.model";
import bcrypt from "bcryptjs";
import { LogInData, RegisterData } from "./types/auth.types";
import AuthModel from "./auth.model";
import mongoose from "mongoose";
import {
    BadRequestError,
    ConflictError,
} from "../../../../common/errorStatusCode";

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

        const lastLogin = new Date();
        const isOnline = true;

        const [user] = await UserModel.create([{ username, email, isOnline }], {
            session,
        });
        await AuthModel.create(
            [
                {
                    userId: user._id,
                    password: hashedPassword,
                    lastLogin,
                },
            ],
            { session }
        );

        await session.commitTransaction();

        return {
            id: user._id,
            username: user.username,
            email: user.email,
            isOnline: user.isOnline,
            lastLogin,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

export const logInService = async ({ email, password }: LogInData) => {
    const user = await UserModel.findOne({
        email,
    });

    if (!user) {
        throw new BadRequestError("Invalid email or password");
    }

    const auth = await AuthModel.findOne({
        userId: user._id,
    }).select("+password");

    if (!auth) {
        throw new BadRequestError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, auth.password);

    if (!isPasswordValid) {
        throw new BadRequestError("Invalid email or password");
    }

    const lastLogin = new Date();
    const isOnline = true;

    await UserModel.updateOne({ _id: user._id }, { isOnline });
    await AuthModel.updateOne({ userId: user._id }, { lastLogin });

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
        lastLogin,
    };
};
