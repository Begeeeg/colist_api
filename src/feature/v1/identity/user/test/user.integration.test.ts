import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import authRouter from "../../auth/auth.router";
import userRouter from "../user.router";
import UserModel from "../user.model";
import AuthModel from "../../auth/auth.model";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/user", userRouter);

const validPayload = {
    username: "johndoe",
    email: "john@example.com",
    password: "Password123",
    confirmPassword: "Password123",
};

async function registerAndGetCookie() {
    const res = await request(app).post("/auth/register").send(validPayload);
    const rawCookie = res.headers["set-cookie"][0];
    return { cookie: rawCookie.split(";")[0], userId: res.body.data.id };
}

describe("GET /user/me (integration)", () => {
    it("returns the authenticated user's data", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app).get("/user/me").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.username).toBe("johndoe");
    });

    it("returns 401 with no auth cookie", async () => {
        const res = await request(app).get("/user/me");

        expect(res.status).toBe(401);
    });
});

describe("PATCH /user/username (integration)", () => {
    it("updates the username with correct password", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .patch("/user/username")
            .set("Cookie", cookie)
            .send({ username: "janedoe", password: validPayload.password });

        expect(res.status).toBe(200);
        expect(res.body.data.username).toBe("janedoe");

        const updated = await UserModel.findOne({ username: "janedoe" });
        expect(updated).not.toBeNull();
    });

    it("returns 400 on wrong password", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .patch("/user/username")
            .set("Cookie", cookie)
            .send({ username: "janedoe", password: "WrongPassword1" });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Invalid password");
    });

    it("returns 409 when new username is already taken", async () => {
        await request(app)
            .post("/auth/register")
            .send({
                ...validPayload,
                username: "existuser",
                email: "existing@example.com",
            });
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .patch("/user/username")
            .set("Cookie", cookie)
            .send({ username: "existuser", password: validPayload.password });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Username already in use");
    });
});

describe("PATCH /user/password (integration)", () => {
    it("updates the password with correct current password", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .patch("/user/password")
            .set("Cookie", cookie)
            .send({
                currentPassword: validPayload.password,
                newPassword: "NewPassword1",
                confirmNewPassword: "NewPassword1", // ← added
            });

        expect(res.status).toBe(200);

        const loginRes = await request(app).post("/auth/login").send({
            email: validPayload.email,
            password: "NewPassword1",
        });
        expect(loginRes.status).toBe(200);
    });

    it("returns 400 when current password is wrong", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .patch("/user/password")
            .set("Cookie", cookie)
            .send({ currentPassword: "wrong", newPassword: "NewPassword1" });

        expect(res.status).toBe(400);
    });
});

describe("GET /user/search (integration)", () => {
    it("finds users matching the query", async () => {
        const { cookie } = await registerAndGetCookie();

        const res = await request(app)
            .get("/user/search?username=john")
            .set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].username).toBe("johndoe");
    });
});

describe("DELETE /user/me (integration)", () => {
    it("deletes the user and auth record on correct password", async () => {
        const { cookie, userId } = await registerAndGetCookie();

        const res = await request(app)
            .delete("/user/me")
            .set("Cookie", cookie)
            .send({ password: validPayload.password });

        expect(res.status).toBe(200);

        const deletedUser = await UserModel.findById(userId);
        expect(deletedUser).toBeNull();

        const deletedAuth = await AuthModel.findOne({ userId });
        expect(deletedAuth).toBeNull();
    });

    it("returns 400 and does not delete on wrong password", async () => {
        const { cookie, userId } = await registerAndGetCookie();

        const res = await request(app)
            .delete("/user/me")
            .set("Cookie", cookie)
            .send({ password: "WrongPassword1" });

        expect(res.status).toBe(400);

        const stillExists = await UserModel.findById(userId);
        expect(stillExists).not.toBeNull();
    });
});
