import mongoose from 'mongoose';

// Stores the full rack canvas layout as a JSON blob per user.
// One document per user — upserted on every save.
const RackLayoutSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  elements: { type: mongoose.Schema.Types.Mixed, default: [] },
}, { timestamps: true });

export default mongoose.models.RackLayout || mongoose.model('RackLayout', RackLayoutSchema);
