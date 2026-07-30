import express from "express";
import request from "supertest";
import authRouter from "../auth.router";
import UserModel from "../../user/user.model";
import AuthModel from "../auth.model";

const app = express();
app.use(express.json());
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

    it("rolls back and returns 400 on duplicate username", async () => {
        await request(app).post("/auth/register").send(validPayload);

        const res = await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                email: "different@example.com",
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Username already exists");

        const count = await UserModel.countDocuments({ username: "johndoe" });
        expect(count).toBe(1); // no partial/duplicate data left behind
    });

    it("rolls back and returns 400 on duplicate email", async () => {
        await request(app).post("/auth/register").send(validPayload);

        const res = await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                username: "janedoe",
            });

        expect(res.status).toBe(400);
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
