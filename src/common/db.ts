import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const RETRY_INTERVAL = 5000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (): Promise<void> => {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        throw new Error("MONGO_URI is not properly defined");
    }

    while (true) {
        try {
            await mongoose.connect(mongoURI);
            return;
        } catch (error) {
            console.error("❌ MongoDB Connection Failed:");
            console.error(error);
            console.log(`🔄 Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
            await sleep(RETRY_INTERVAL);
        }
    }
};

mongoose.connection.on("connected", () => {
    console.log("✅ MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Error:", err);
});

let reconnecting = false;

mongoose.connection.on("disconnected", async () => {
    console.warn("⚠️ MongoDB disconnected.");

    if (reconnecting) return;
    reconnecting = true;

    try {
        await connectDB();
    } finally {
        reconnecting = false;
    }
});

export default connectDB;
