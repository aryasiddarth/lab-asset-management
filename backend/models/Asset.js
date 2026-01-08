import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    // INTERNAL UNIQUE IDENTIFIER (for imports, scripts, DB integrity)
    // NOT shown in UI
    assetTag: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    // Serial number in physical register (NOT unique globally)
    slNo: {
      type: Number,
      required: true,
      index: true
    },

    // Human-readable inventory ID
    assetId: {
      type: String,
      required: true,
      index: true
    },

    // Lab assignment (nullable → stock/unassigned)
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      default: null
    },

    // Asset condition
    status: {
      type: String,
      enum: ["WORKING", "UNDER_REPAIR", "SCRAPPED", "LOST"],
      default: "WORKING"
    },

    // Purchase date
    purchaseDate: {
      type: Date
    },

    // Page number in physical register
    pageNo: {
      type: Number,
      required: true
    },

    // Model / description
    model: {
      type: String,
      required: true
    },

    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    // Cost (document clearly whether per-unit or total)
    cost: {
      type: Number,
      required: true,
      min: 0
    },

    // Notes
    remarks: {
      type: String
    }
  },
  {
    timestamps: true // createdAt = entry date
  }
);

export default mongoose.model("Asset", assetSchema);
