import mongoose from "mongoose";

const labAssetSchema = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true
    },

    quantityAssigned: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("LabAsset", labAssetSchema);
