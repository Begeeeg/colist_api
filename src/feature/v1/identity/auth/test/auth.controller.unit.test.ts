import express from "express";
import request from "supertest";
import authRouter from "../auth.router";
import * as authService from "../auth.service";
import { generateTokenandSetCookie } from "../../../../../common/genTokenAndSetCookie";

jest.mock("../auth.service");
jest.mock("../../../../../common/genTokenAndSetCookie");
jest.mock("../../../../../common/validatorDataDto", () => ({
    validate: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

describe("POST /auth/register (unit)", () => {
    const mockUser = {
        id: "64f1b2c3d4e5f6a7b8c9d0e1",
        username: "johndoe",
        email: "john@example.com",
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

    it("returns 400 when the service throws a known error", async () => {
        (authService.registerService as jest.Mock).mockRejectedValue(
            new Error("Username already exists")
        );

        const res = await request(app).post("/auth/register").send({
            username: "johndoe",
            email: "john@example.com",
            password: "Password123!",
        });

        expect(res.status).toBe(400);
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
