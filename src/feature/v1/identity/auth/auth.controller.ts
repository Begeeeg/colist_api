import { Request, Response } from "express";
import * as authService from "./auth.service";
import { generateTokenandSetCookie } from "../../../../common/genTokenAndSetCookie";

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
        if (error instanceof Error) {
            res.status(400).json({
                message: error.message,
            });
            return;
        }

        res.status(500).json({
            message: "Internal server error",
        });
    }
};
