import mongoose from 'mongoose';

const RackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rackName: { type: String, required: true }, // e.g., "A-1", "Fridge"
  category: { type: String }, // e.g., "Antibiotics"
}, { timestamps: true });

export default mongoose.models.Rack || mongoose.model('Rack', RackSchema);