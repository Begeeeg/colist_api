import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../../user/user.model";
import AuthModel from "../auth.model";
import { registerService } from "../auth.service";
import { ConflictError } from "../../../../../common/errorStatusCode";

jest.mock("../../user/user.model");
jest.mock("../auth.model");
jest.mock("bcryptjs");

describe("registerService (unit)", () => {
    let mockSession: any;

    beforeEach(() => {
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };
        jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    const input = {
        username: "johndoe",
        email: "john@example.com",
        password: "Password123!",
    };

    it("creates a user and commits the transaction", async () => {
        (UserModel.findOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
        (UserModel.create as jest.Mock).mockResolvedValue([
            {
                _id: "user-id-123",
                username: input.username,
                email: input.email,
            },
        ]);
        (AuthModel.create as jest.Mock).mockResolvedValue([{}]);

        const result = await registerService(input);

        expect(result).toEqual({
            id: "user-id-123",
            username: input.username,
            email: input.email,
        });
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    });

    it("throws ConflictError and aborts if username exists", async () => {
        (UserModel.findOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({
                username: input.username,
                email: "other@example.com",
            }),
        });

        await expect(registerService(input)).rejects.toThrow(ConflictError);
        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("throws ConflictError if email exists", async () => {
        (UserModel.findOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({
                username: "someoneelse",
                email: input.email,
            }),
        });

        await expect(registerService(input)).rejects.toThrow(
            "Email already exists"
        );
    });
});
