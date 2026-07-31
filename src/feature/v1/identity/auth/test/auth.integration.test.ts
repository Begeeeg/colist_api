import express from "express";
import request from "supertest";
import authRouter from "../auth.router";
import UserModel from "../../user/user.model";
import AuthModel from "../auth.model";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);

const validPayload = {
    username: "johndoe",
    email: "john@example.com",
    password: "Password123",
    confirmPassword: "Password123",
};

describe("POST /auth/register (integration)", () => {
    it("registers a user end-to-end and persists it to the DB", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.data.username).toBe("johndoe");

        const savedUser = await UserModel.findOne({ username: "johndoe" });
        expect(savedUser).not.toBeNull();

        const savedAuth = await AuthModel.findOne({ userId: savedUser?._id });
        expect(savedAuth).not.toBeNull();
        expect(savedAuth?.password).not.toBe("Password123"); // confirm it's hashed
    });

    it("rolls back and returns 409 on duplicate username", async () => {
        await request(app).post("/auth/register").send(validPayload);

        const res = await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                email: "different@example.com",
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Username already exists");

        const count = await UserModel.countDocuments({ username: "johndoe" });
        expect(count).toBe(1); // no partial/duplicate data left behind
    });

    it("rolls back and returns 409 on duplicate email", async () => {
        await request(app).post("/auth/register").send(validPayload);

        const res = await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                username: "janedoe",
            });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Email already exists");
    });

    it("returns 400 when password and confirmPassword don't match", async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                confirmPassword: "Password321",
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBeDefined();
    });
});

describe("POST /auth/login (integration)", () => {
    beforeEach(async () => {
        await request(app).post("/auth/register").send(validPayload);
    });

    it("logs in successfully with correct credentials", async () => {
        const res = await request(app).post("/auth/login").send({
            email: validPayload.email,
            password: validPayload.password,
        });

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe(validPayload.email);
        expect(res.headers["set-cookie"]).toBeDefined();

        const savedUser = await UserModel.findOne({
            email: validPayload.email,
        });
        expect(savedUser?.isOnline).toBe(true);
    });

    it("returns 400 on wrong password", async () => {
        const res = await request(app).post("/auth/login").send({
            email: validPayload.email,
            password: "WrongPassword1",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid email or password");
    });

    it("returns 400 for a non-existent email", async () => {
        const res = await request(app).post("/auth/login").send({
            email: "doesnotexist@example.com",
            password: "Password123",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid email or password");
    });
});

describe("POST /auth/logout (integration)", () => {
    it("logs out successfully and clears the cookie", async () => {
        const agent = request.agent(app); // persists cookies across calls

        await agent.post("/auth/register").send(validPayload);

        const res = await agent.post("/auth/logout").send();

        expect(res.status).toBe(200);
        expect(res.body.message).toBe("User logged out successfully");

        const savedUser = await UserModel.findOne({
            email: validPayload.email,
        });
        expect(savedUser?.isOnline).toBe(false);

        // confirm jwt cookie was cleared in the response
        const cookies = res.headers["set-cookie"];
        expect(cookies?.[0]).toMatch(/jwt=;/);
    });

    it("returns 401/403 when no auth cookie is present", async () => {
        // ASSUMPTION: protectRoutes rejects unauthenticated requests with 401.
        // Adjust this expected status once you share protectRoutes' real behavior.
        const res = await request(app).post("/auth/logout").send();

        expect([401, 403]).toContain(res.status);
    });
});
