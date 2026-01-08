import express from "express";
import jwt from "jsonwebtoken";
import Asset from "../models/Asset.js";
import LabAsset from "../models/LabAsset.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Helper: optionally get user from JWT (for role-based filtering)
 */
async function getOptionalUser(req) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    return user;
  } catch {
    return null;
  }
}

/**
 * GET /api/assets
 * Inventory overview
 * Returns:
 * - total quantity
 * - assigned quantity
 * - remaining quantity
 */
router.get("/", async (req, res) => {
  try {
    const user = await getOptionalUser(req);

    const assets = await Asset.find().sort({ slNo: 1 });

    const result = await Promise.all(
      assets.map(async (asset) => {
        // If technician → show only assets allocated to their lab
        if (user?.role === "technician" && user.labId) {
          const assignedToLab = await LabAsset.findOne({
            assetId: asset._id,
            labId: user.labId
          });

          if (!assignedToLab) return null;
        }

        const assignedAgg = await LabAsset.aggregate([
          { $match: { assetId: asset._id } },
          { $group: { _id: null, total: { $sum: "$quantityAssigned" } } }
        ]);

        const assignedQty = assignedAgg[0]?.total || 0;

        return {
          _id: asset._id,
          slNo: asset.slNo,
          assetId: asset.assetId,
          entryDate: asset.entryDate,
          purchaseDate: asset.purchaseDate,
          pageNo: asset.pageNo,
          model: asset.model,
          totalQuantity: asset.quantity,
          assignedQuantity: assignedQty,
          remainingQuantity: asset.quantity - assignedQty,
          cost: asset.cost,
          remarks: asset.remarks
        };
      })
    );

    res.json(result.filter(Boolean));
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/assets/:id
 * Single asset with lab allocations
 */
router.get("/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const allocations = await LabAsset.find({ assetId: asset._id })
      .populate("labId", "name code department");

    const assignedQty = allocations.reduce(
      (sum, a) => sum + a.quantityAssigned,
      0
    );

    res.json({
      _id: asset._id,
      slNo: asset.slNo,
      assetId: asset.assetId,
      entryDate: asset.entryDate,
      purchaseDate: asset.purchaseDate,
      pageNo: asset.pageNo,
      model: asset.model,
      totalQuantity: asset.quantity,
      assignedQuantity: assignedQty,
      remainingQuantity: asset.quantity - assignedQty,
      cost: asset.cost,
      remarks: asset.remarks,
      allocations: allocations.map((a) => ({
        lab: a.labId,
        quantityAssigned: a.quantityAssigned
      }))
    });
  } catch (err) {
    console.error("Error fetching asset:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/assets
 * Create inventory asset (NO LAB)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      slNo,
      assetId,
      entryDate,
      purchaseDate,
      pageNo,
      model,
      quantity,
      cost,
      remarks
    } = req.body;

    const asset = await Asset.create({
      slNo,
      assetId,
      entryDate,
      purchaseDate,
      pageNo,
      model,
      quantity,
      cost,
      remarks
    });

    res.status(201).json(asset);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "SL No or Asset ID already exists"
      });
    }
    console.error("Error creating asset:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
