import mongoose from "mongoose";

export async function connect() {
  try {
    const mongoUri = process.env.MONGO_URL;

    console.log("✅ MONGO_URL =", mongoUri); // Debug log

    if (!mongoUri) {
      throw new Error("❌ MONGO_URL is undefined. Check your .env.local file.");
    }

    if (mongoose.connection.readyState === 1) {
      console.log("✅ Already connected to MongoDB");
      return;
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}