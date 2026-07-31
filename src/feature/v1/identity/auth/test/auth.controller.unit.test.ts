import express from "express";
import request from "supertest";
import authRouter from "../auth.router";
import * as authService from "../auth.service";
import { generateTokenandSetCookie } from "../../../../../common/genTokenAndSetCookie";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../../../../common/errorStatusCode";

jest.mock("../auth.service");
jest.mock("../../../../../common/genTokenAndSetCookie");
jest.mock("../../../../../common/validatorDataDto", () => ({
    validate: () => (req: any, res: any, next: any) => next(),
}));

jest.mock("../../../../../common/protectRoutes", () => ({
    protectRoutes: (req: any, res: any, next: any) => {
        req.user = { _id: "mock-user-id-123", username: "johndoe" };
        next();
    },
}));

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

describe("POST /auth/register (unit)", () => {
    const mockUser = {
        id: "64f1b2c3d4e5f6a7b8c9d0e1",
        username: "johndoe",
        email: "john@example.com",
        isOnline: true,
        lastLogin: new Date().toISOString(),
    };

    it("returns 201 and the created user on success", async () => {
        (authService.registerService as jest.Mock).mockResolvedValue(mockUser);

        const res = await request(app).post("/auth/register").send({
            username: "johndoe",
            email: "john@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(201);
        expect(res.body.data).toEqual(mockUser);
        expect(generateTokenandSetCookie).toHaveBeenCalledWith(
            expect.anything(),
            mockUser.id.toString()
        );
    });

    it("returns 400 when the service throws a known ConflictError", async () => {
        (authService.registerService as jest.Mock).mockRejectedValue(
            new ConflictError("Username already exists")
        );

        const res = await request(app).post("/auth/register").send({
            username: "johndoe",
            email: "john@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Username already exists");
    });

    it("returns 500 when a non-Error is thrown", async () => {
        (authService.registerService as jest.Mock).mockRejectedValue("boom");

        const res = await request(app).post("/auth/register").send({
            username: "johndoe",
            email: "john@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Internal server error");
    });
});

describe("POST /auth/login (unit)", () => {
    const mockUser = {
        id: "64f1b2c3d4e5f6a7b8c9d0e1",
        username: "johndoe",
        email: "john@example.com",
        isOnline: true,
        lastLogin: new Date().toISOString(),
    };

    it("returns 200 and the user on successful login", async () => {
        (authService.logInService as jest.Mock).mockResolvedValue(mockUser);

        const res = await request(app).post("/auth/login").send({
            email: "john@example.com",
            password: "Password123",
        });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("User logged in successfully");
        expect(res.body.data).toEqual(mockUser);
        expect(generateTokenandSetCookie).toHaveBeenCalledWith(
            expect.anything(),
            mockUser.id.toString()
        );
    });

    it("returns 400 on invalid credentials", async () => {
        (authService.logInService as jest.Mock).mockRejectedValue(
            new BadRequestError("Invalid email or password")
        );

        const res = await request(app).post("/auth/login").send({
            email: "john@example.com",
            password: "wrongpassword",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid email or password");
    });

    it("returns 500 when a non-Error is thrown", async () => {
        (authService.logInService as jest.Mock).mockRejectedValue("boom");

        const res = await request(app).post("/auth/login").send({
            email: "john@example.com",
            password: "Password123",
        });

        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Internal server error");
    });
});

describe("POST /auth/logout (unit)", () => {
    const mockLogoutResult = {
        id: "64f1b2c3d4e5f6a7b8c9d0e1",
        username: "johndoe",
        email: "john@example.com",
        isOnline: false,
        lastLogout: new Date().toISOString(),
    };

    it("returns 200 and clears the cookie on successful logout", async () => {
        (authService.logOutService as jest.Mock).mockResolvedValue(
            mockLogoutResult
        );

        const res = await request(app).post("/auth/logout").send();

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("User logged out successfully");
        expect(res.body.data).toEqual(mockLogoutResult);

        // confirm the jwt cookie was cleared
        const cookies = res.headers["set-cookie"];
        expect(cookies?.[0]).toMatch(/jwt=;/);
    });

    it("returns 404 when the user is not found", async () => {
        (authService.logOutService as jest.Mock).mockRejectedValue(
            new NotFoundError("User not found")
        );

        const res = await request(app).post("/auth/logout").send();

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");
    });
});
