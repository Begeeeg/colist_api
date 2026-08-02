import mongoose from "mongoose";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../../../common/errorStatusCode";
import AuthModel from "../auth/auth.model";
import {
    DeleteUserData,
    GetUserData,
    SearchUsersData,
    UpdatePasswordData,
    UpdateUsernameData,
} from "./types/user.types";
import UserModel from "./user.model";
import bcrypt from "bcryptjs";

export const getUserService = async ({ id }: GetUserData) => {
    const user = await UserModel.findById(id);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
    };
};

export const updateUsernameService = async ({
    id,
    username,
    password,
}: UpdateUsernameData) => {
    const user = await UserModel.findById(id);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const auth = await AuthModel.findOne({
        userId: user._id,
    }).select("+password");

    if (!auth) {
        throw new NotFoundError("Auth record not found");
    }

    const isPasswordValid = await bcrypt.compare(password, auth.password);

    if (!isPasswordValid) {
        throw new BadRequestError("Invalid password");
    }

    if (username === user.username) {
        throw new BadRequestError(
            "New username must be different from your current username"
        );
    }

    const existingUser = await UserModel.findOne({ username });
    if (existingUser) {
        throw new ConflictError("Username already in use");
    }

    user.username = username;
    await user.save();

    return {
        id: user._id,
        username: user.username,
    };
};

export const updatePasswordService = async ({
    id,
    currentPassword,
    newPassword,
}: UpdatePasswordData) => {
    const user = await UserModel.findById(id);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const auth = await AuthModel.findOne({ userId: user._id }).select(
        "+password"
    );
    if (!auth) {
        throw new NotFoundError("Auth record not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        auth.password
    );
    if (!isCurrentPasswordValid) {
        throw new BadRequestError("Current password is incorrect");
    }

    const isSameAsOld = await bcrypt.compare(newPassword, auth.password);
    if (isSameAsOld) {
        throw new BadRequestError(
            "New password must be different from your current password"
        );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    auth.password = hashedPassword;
    await auth.save();

    return {
        id: user._id,
        username: user.username,
    };
};

export const searchUsersService = async ({ query }: SearchUsersData) => {
    if (!query || query.trim().length === 0) {
        throw new BadRequestError("Search query is required");
    }

    const users = await UserModel.find({
        username: { $regex: query.trim(), $options: "i" },
    })
        .select("username email isOnline")
        .limit(20);

    return users.map((user) => ({
        id: user._id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline,
    }));
};

export const deleteUserService = async ({ id, password }: DeleteUserData) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const user = await UserModel.findById(id).session(session);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        const auth = await AuthModel.findOne({ userId: user._id })
            .select("+password")
            .session(session);
        if (!auth) {
            throw new NotFoundError("Auth record not found");
        }

        const isPasswordValid = await bcrypt.compare(password, auth.password);
        if (!isPasswordValid) {
            throw new BadRequestError("Invalid password");
        }

        await AuthModel.deleteOne({ userId: user._id }).session(session);
        await UserModel.deleteOne({ _id: user._id }).session(session);

        await session.commitTransaction();

        return {
            id: user._id,
            username: user.username,
        };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};
