import { Request, Response } from "express";
import * as authService from "./auth.service";
import { generateTokenandSetCookie } from "../../../../common/genTokenAndSetCookie";
import { AppError } from "../../../../common/errorStatusCode";

export const registerController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = await authService.registerService(req.body);

        generateTokenandSetCookie(res, user.id.toString());

        res.status(201).json({
            message: "User created successfully",
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

export const logInController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = await authService.logInService(req.body);

        generateTokenandSetCookie(res, user.id.toString());

        res.status(200).json({
            message: "User logged in successfully",
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

export const logOutController = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const userId = req.user?._id?.toString();
        const user = await authService.logOutService(userId);

        res.cookie("jwt", "", {
            maxAge: 0,
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        res.status(200).json({
            message: "User logged out successfully",
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
