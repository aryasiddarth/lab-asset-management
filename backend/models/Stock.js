import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  stockId: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', default: null },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model('Stock', stockSchema);

