import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // We will hash this!
  pharmacyName: { type: String },
  role: { type: String, default: 'admin' }, // 'admin' for pharmacy owners
  otp: { type: String },
  otpExpiry: { type: Date },
  lastLoginAt: { type: Date },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);