import { Request, Response } from "express";
import * as userService from "./user.service";
import { AppError } from "../../../../common/errorStatusCode";

export const getUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const user = await userService.getUserService({
            id: req.user._id.toString(),
        });

        res.status(200).json({
            message: "User fetched successfully",
            data: user,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updateUsernameController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const user = await userService.updateUsernameService({
            id: req.user._id.toString(),
            username: req.body.username,
            password: req.body.password,
        });

        res.status(200).json({
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const updatePasswordController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const result = await userService.updatePasswordService({
            id: req.user._id.toString(),
            currentPassword: req.body.currentPassword,
            newPassword: req.body.newPassword,
        });

        res.status(200).json({
            message: "Password updated successfully",
            data: result,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const searchUsersController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const query = req.query.username;

        console.log("req.query:", req.query);
        console.log("req.body:", req.body);
        console.log("req.params:", req.params);

        if (typeof query !== "string") {
            res.status(400).json({ message: "Invalid search query" });
            return;
        }

        const users = await userService.searchUsersService({ query });

        res.status(200).json({
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const deleteUserController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const result = await userService.deleteUserService({
            id: req.user._id.toString(),
            password: req.body.password,
        });

        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
            message: "Account deleted successfully",
            data: result,
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                message: error.message,
            });
            return;
        }

        if (error instanceof Error) {
            res.status(500).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};
