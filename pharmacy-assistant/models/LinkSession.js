import mongoose from 'mongoose';

const LinkSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pairingCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['waiting', 'connected', 'expired'],
    default: 'waiting'
  },
  phoneUserAgent: {
    type: String,
    default: null
  },
  lastPhoto: {
    imagePreview: { type: String, default: null },   // small thumbnail (not full base64)
    type:         { type: String, enum: ['prescription', 'medicine'], default: 'prescription' },
    result:       { type: mongoose.Schema.Types.Mixed, default: null },
    timestamp:    { type: Date, default: null }
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }   // MongoDB TTL — auto-deletes when expiresAt is reached
  }
}, { timestamps: true });

// Compound index: fast lookup by code + active status
LinkSessionSchema.index({ pairingCode: 1, status: 1 });
// Fast lookup for user's active sessions
LinkSessionSchema.index({ userId: 1, status: 1 });

export default mongoose.models.LinkSession || mongoose.model('LinkSession', LinkSessionSchema);
