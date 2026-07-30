import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import UserModel from "../feature/v1/identity/user/user.model";
import AuthModel from "../feature/v1/identity/auth/auth.model";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1 },
    });
    const uri = replSet.getUri();
    await mongoose.connect(uri);
    await UserModel.init();
    await AuthModel.init();
});

afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
