import { NotFoundError } from "../../../../common/errorStatusCode";
import { GetUserData } from "./types/user.types";
import UserModel from "./user.model";

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
