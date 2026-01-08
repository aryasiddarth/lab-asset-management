import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  location: { type: String },
  remarks: { type: String },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  technicianName: { type: String, default: null }
}, { timestamps: true });

export default mongoose.model('Lab', labSchema);

