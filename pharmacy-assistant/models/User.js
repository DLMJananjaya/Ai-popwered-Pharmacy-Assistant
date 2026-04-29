import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true // Ensures email lookups aren't case-sensitive
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: "https://cdn.pixabay.com/photo/2022/10/21/20/29/wolf-head-7537918_1280.jpg"
  }, // Added for your TopHeader avatar selection
  pharmacyName: {
    type: String
  },
  role: {
    type: String,
    default: 'admin'
  },

  // --- OTP & Security Fields ---
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Automatically creates 'createdAt' and 'updatedAt'
});

// This prevents Mongoose from creating the model multiple times during Next.js Hot Reloads
export default mongoose.models.User || mongoose.model('User', UserSchema);