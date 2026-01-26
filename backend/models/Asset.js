import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      default: null
    },

    status: {
      type: String,
      enum: ["WORKING", "UNDER_REPAIR", "SCRAPPED", "LOST"],
      default: "WORKING"
    },

    purchaseDate: {
      type: Date
    },

    pageNo: {
      type: Number,
      default: 0
    },

    model: {
      type: String,
      default: "Unknown Model"
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1
    },

    cost: {
      type: Number,
      default: 0,
      min: 0
    },

    remarks: {
      type: String
    },

    // Keep old fields for compatibility
    serialNumber: {
      type: String
    },

    warrantyExpiry: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Asset", assetSchema);
