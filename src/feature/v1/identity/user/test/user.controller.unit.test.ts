import express from "express";
import request from "supertest";
import userRouter from "../user.router";
import * as userService from "../user.service";
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from "../../../../../common/errorStatusCode";

jest.mock("../user.service");
jest.mock("../../../../../common/validatorDataDto", () => ({
    validate: () => (req: any, res: any, next: any) => next(),
}));
jest.mock("../../../../../common/protectRoutes", () => ({
    protectRoutes: (req: any, res: any, next: any) => {
        req.user = { _id: "user-id-123", username: "johndoe" };
        next();
    },
}));

const app = express();
app.use(express.json());
app.use("/user", userRouter);

describe("GET /user/me (unit)", () => {
    it("returns 200 and the user on success", async () => {
        const mockUser = {
            id: "user-id-123",
            username: "johndoe",
            email: "john@example.com",
            isOnline: true,
        };
        (userService.getUserService as jest.Mock).mockResolvedValue(mockUser);

        const res = await request(app).get("/user/me");

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual(mockUser);
    });

    it("returns 404 when the user is not found", async () => {
        (userService.getUserService as jest.Mock).mockRejectedValue(
            new NotFoundError("User not found")
        );

        const res = await request(app).get("/user/me");

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("User not found");
    });
});

describe("PATCH /user/username (unit)", () => {
    it("returns 200 on successful update", async () => {
        (userService.updateUsernameService as jest.Mock).mockResolvedValue({
            id: "user-id-123",
            username: "newname",
        });

        const res = await request(app)
            .patch("/user/username")
            .send({ username: "newname", password: "Password123" });

        expect(res.status).toBe(200);
        expect(res.body.data.username).toBe("newname");
    });

    it("returns 409 when new username is already taken", async () => {
        (userService.updateUsernameService as jest.Mock).mockRejectedValue(
            new ConflictError("Username already in use")
        );

        const res = await request(app)
            .patch("/user/username")
            .send({ username: "taken", password: "Password123" });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Username already in use");
    });

    it("returns 400 on invalid password", async () => {
        (userService.updateUsernameService as jest.Mock).mockRejectedValue(
            new BadRequestError("Invalid password")
        );

        const res = await request(app)
            .patch("/user/username")
            .send({ username: "newname", password: "wrong" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid password");
    });
});

describe("PATCH /user/password (unit)", () => {
    it("returns 200 on successful update", async () => {
        (userService.updatePasswordService as jest.Mock).mockResolvedValue({
            id: "user-id-123",
            username: "johndoe",
        });

        const res = await request(app)
            .patch("/user/password")
            .send({ currentPassword: "OldPass1", newPassword: "NewPass1" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Password updated successfully");
    });

    it("returns 400 when current password is incorrect", async () => {
        (userService.updatePasswordService as jest.Mock).mockRejectedValue(
            new BadRequestError("Current password is incorrect")
        );

        const res = await request(app)
            .patch("/user/password")
            .send({ currentPassword: "wrong", newPassword: "NewPass1" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Current password is incorrect");
    });
});

describe("GET /user/search (unit)", () => {
    it("returns 200 and matching users", async () => {
        const mockUsers = [
            { id: "1", username: "johndoe", email: "j@x.com", isOnline: true },
        ];
        (userService.searchUsersService as jest.Mock).mockResolvedValue(
            mockUsers
        );

        const res = await request(app).get("/user/search?username=john");

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual(mockUsers);
    });

    it("returns 400 when query param is missing", async () => {
        const res = await request(app).get("/user/search");

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid search query");
    });
});

describe("DELETE /user/me (unit)", () => {
    it("returns 200 and clears the cookie on successful deletion", async () => {
        (userService.deleteUserService as jest.Mock).mockResolvedValue({
            id: "user-id-123",
            username: "johndoe",
        });

        const res = await request(app)
            .delete("/user/me")
            .send({ password: "Password123" });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("Account deleted successfully");

        const cookies = res.headers["set-cookie"];
        expect(cookies?.[0]).toMatch(/jwt=;/);
    });

    it("returns 400 on invalid password", async () => {
        (userService.deleteUserService as jest.Mock).mockRejectedValue(
            new BadRequestError("Invalid password")
        );

        const res = await request(app)
            .delete("/user/me")
            .send({ password: "wrong" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid password");
    });
});
