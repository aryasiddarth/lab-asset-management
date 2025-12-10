import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  assetTag: { type: String, required: true, unique: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  status: {
    type: String,
    enum: ['WORKING', 'UNDER_REPAIR', 'SCRAPPED', 'LOST'],
    default: 'WORKING'
  },
  model: {
    name: { type: String },
    manufacturer: { type: String }
  },
  serialNumber: { type: String },
  purchaseDate: { type: Date },
  warrantyExpiry: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model('Asset', assetSchema);

