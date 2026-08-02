import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserModel from "../user.model";
import AuthModel from "../../auth/auth.model";
import {
    getUserService,
    updateUsernameService,
    updatePasswordService,
    searchUsersService,
    deleteUserService,
} from "../user.service";
import {
    NotFoundError,
    BadRequestError,
    ConflictError,
} from "../../../../../common/errorStatusCode";

jest.mock("../user.model");
jest.mock("../../auth/auth.model");
jest.mock("bcryptjs");

describe("getUserService (unit)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns user data when found", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "johndoe",
            email: "john@example.com",
            isOnline: true,
        });

        const result = await getUserService({ id: "user-id-123" });

        expect(result).toEqual({
            id: "user-id-123",
            username: "johndoe",
            email: "john@example.com",
            isOnline: true,
        });
    });

    it("throws NotFoundError when user doesn't exist", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(getUserService({ id: "bad-id" })).rejects.toThrow(
            NotFoundError
        );
    });
});

describe("updateUsernameService (unit)", () => {
    beforeEach(() => jest.clearAllMocks());

    const input = {
        id: "user-id-123",
        username: "newname",
        password: "Password123",
    };

    it("updates the username on valid password and unique new username", async () => {
        const mockUser: any = {
            _id: "user-id-123",
            username: "oldname",
            save: jest.fn().mockResolvedValue(true),
        };
        (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-password" }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        // second findOne call checks if new username is taken
        (UserModel.findOne as jest.Mock).mockResolvedValue(null);

        const result = await updateUsernameService(input);

        expect(mockUser.username).toBe("newname");
        expect(mockUser.save).toHaveBeenCalled();
        expect(result).toEqual({ id: "user-id-123", username: "newname" });
    });

    it("throws NotFoundError when user doesn't exist", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(updateUsernameService(input)).rejects.toThrow(
            NotFoundError
        );
    });

    it("throws NotFoundError when auth record is missing", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "oldname",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });

        await expect(updateUsernameService(input)).rejects.toThrow(
            "Auth record not found"
        );
    });

    it("throws BadRequestError when password is invalid", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "oldname",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-password" }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(updateUsernameService(input)).rejects.toThrow(
            "Invalid password"
        );
    });

    it("throws BadRequestError when new username equals current username", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "newname", // same as input.username
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-password" }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        await expect(updateUsernameService(input)).rejects.toThrow(
            "New username must be different from your current username"
        );
    });

    it("throws ConflictError when new username is already taken", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "oldname",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-password" }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (UserModel.findOne as jest.Mock).mockResolvedValue({
            username: "newname",
        });

        await expect(updateUsernameService(input)).rejects.toThrow(
            ConflictError
        );
    });
});

describe("updatePasswordService (unit)", () => {
    beforeEach(() => jest.clearAllMocks());

    const input = {
        id: "user-id-123",
        currentPassword: "OldPassword1",
        newPassword: "NewPassword1",
    };

    it("updates the password when current password is valid and new password differs", async () => {
        const mockAuth: any = {
            password: "hashed-old-password",
            save: jest.fn().mockResolvedValue(true),
        };
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
            username: "johndoe",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockResolvedValue(mockAuth),
        });
        (bcrypt.compare as jest.Mock)
            .mockResolvedValueOnce(true) // currentPassword check
            .mockResolvedValueOnce(false); // isSameAsOld check
        (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-new-password");

        const result = await updatePasswordService(input);

        expect(mockAuth.password).toBe("hashed-new-password");
        expect(mockAuth.save).toHaveBeenCalled();
        expect(result).toEqual({ id: "user-id-123", username: "johndoe" });
    });

    it("throws BadRequestError when current password is incorrect", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-old-password" }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(updatePasswordService(input)).rejects.toThrow(
            "Current password is incorrect"
        );
    });

    it("throws BadRequestError when new password matches the old one", async () => {
        (UserModel.findById as jest.Mock).mockResolvedValue({
            _id: "user-id-123",
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest
                .fn()
                .mockResolvedValue({ password: "hashed-old-password" }),
        });
        (bcrypt.compare as jest.Mock)
            .mockResolvedValueOnce(true) // currentPassword valid
            .mockResolvedValueOnce(true); // same as old

        await expect(updatePasswordService(input)).rejects.toThrow(
            "New password must be different from your current password"
        );
    });
});

describe("searchUsersService (unit)", () => {
    beforeEach(() => jest.clearAllMocks());

    it("returns matching users", async () => {
        const mockQuery = {
            select: jest.fn().mockReturnThis(),
            limit: jest
                .fn()
                .mockResolvedValue([
                    {
                        _id: "1",
                        username: "johndoe",
                        email: "j@x.com",
                        isOnline: true,
                    },
                ]),
        };
        (UserModel.find as jest.Mock).mockReturnValue(mockQuery);

        const result = await searchUsersService({ query: "john" });

        expect(result).toEqual([
            { id: "1", username: "johndoe", email: "j@x.com", isOnline: true },
        ]);
    });

    it("throws BadRequestError on empty query", async () => {
        await expect(searchUsersService({ query: "  " })).rejects.toThrow(
            "Search query is required"
        );
    });
});

describe("deleteUserService (unit)", () => {
    let mockSession: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSession = {
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
        };
        jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession);
    });

    const input = { id: "user-id-123", password: "Password123" };

    it("deletes the user and auth record on valid password", async () => {
        (UserModel.findById as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({
                _id: "user-id-123",
                username: "johndoe",
            }),
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                session: jest
                    .fn()
                    .mockResolvedValue({ password: "hashed-password" }),
            }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (AuthModel.deleteOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({}),
        });
        (UserModel.deleteOne as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({}),
        });

        const result = await deleteUserService(input);

        expect(result).toEqual({ id: "user-id-123", username: "johndoe" });
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.abortTransaction).not.toHaveBeenCalled();
    });

    it("aborts and throws BadRequestError on invalid password", async () => {
        (UserModel.findById as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue({
                _id: "user-id-123",
                username: "johndoe",
            }),
        });
        (AuthModel.findOne as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnValue({
                session: jest
                    .fn()
                    .mockResolvedValue({ password: "hashed-password" }),
            }),
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        await expect(deleteUserService(input)).rejects.toThrow(BadRequestError);
        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it("aborts and throws NotFoundError when user doesn't exist", async () => {
        (UserModel.findById as jest.Mock).mockReturnValue({
            session: jest.fn().mockResolvedValue(null),
        });

        await expect(deleteUserService(input)).rejects.toThrow(NotFoundError);
        expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
});
