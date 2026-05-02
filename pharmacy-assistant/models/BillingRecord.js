import mongoose from 'mongoose';

const BillingRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    name:      String,
    qty:       Number,
    unitPrice: Number,
  }],
  total:         { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  amountPayable: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['card', 'cash'], default: 'cash' },
}, { timestamps: true });

export default mongoose.models.BillingRecord || mongoose.model('BillingRecord', BillingRecordSchema);
