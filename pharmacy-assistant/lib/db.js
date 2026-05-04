// lib/db.js
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast in 5s instead of 30s
      connectTimeoutMS: 5000,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected");
      return mongoose;
    }).catch((err) => {
      cached.promise = null; // Reset so next request retries
      console.error("❌ MongoDB connection failed:", err.message);
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;