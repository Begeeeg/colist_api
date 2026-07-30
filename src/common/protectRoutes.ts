import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import UserModel from "../feature/v1/identity/user/user.model";

interface TokenPayload extends JwtPayload {
    userId: string;
}

export const protectRoutes = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.jwt;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized access" });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as TokenPayload;

        const user = await UserModel.findById(decoded.userId).select(
            "-password"
        );
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectRoutes:", error);
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
};
