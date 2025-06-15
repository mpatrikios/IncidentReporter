import mongoose from 'mongoose';

<<<<<<< HEAD
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://miapatrikios:Kefalonia2004@cluster0.yimatbm.mongodb.net/incident_reporter';
=======
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/incidentreporter';
>>>>>>> d2063bd (Improve connection to database and provide more robust server startup)

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
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 5000, // 5 second timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.log('MongoDB connection failed, will retry on next request');
    throw e;
  }

  return cached.conn;
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

export default mongoose;