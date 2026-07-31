import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../../../common/errorStatusCode";
import AuthModel from "../auth/auth.model";
import { GetUserData, UpdateUserData } from "./types/user.types";
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
}: UpdateUserData) => {
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
