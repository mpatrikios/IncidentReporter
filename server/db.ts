import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://miapatrikios:Kefalonia2004@cluster0.yimatbm.mongodb.net/incidentreporter?retryWrites=true&w=majority&authSource=admin&ssl=true';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      w: 'majority'
    };

    console.log("🔌 Attempting MongoDB connection...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      console.error("❌ MongoDB connection failed:", error.message);
      if (error.message.includes('IP')) {
        console.log("💡 This may be an IP whitelist issue. Add 0.0.0.0/0 to your MongoDB Atlas IP whitelist for development.");
      }
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.log("MongoDB connection failed, will retry on next request");
    throw e;
  }

  return cached.conn;
}

// Connection event handlers
mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔌 MongoDB disconnected");
});

export default mongoose;
