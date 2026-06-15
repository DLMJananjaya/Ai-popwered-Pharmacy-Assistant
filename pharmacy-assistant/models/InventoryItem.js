import mongoose from 'mongoose';

const InventoryItemSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, required: true },
  strength:   { type: String, required: true },
  qty:        { type: Number, required: true, default: 0 },
  expireDate: { type: Date,   required: true },
  unitPrice:  { type: Number, required: true },
}, { timestamps: true });

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', InventoryItemSchema);
