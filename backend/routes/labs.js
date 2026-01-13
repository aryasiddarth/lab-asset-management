import express from "express";
import jwt from "jsonwebtoken";
import Lab from "../models/Lab.js";
import Asset from "../models/Asset.js";
import LabAsset from "../models/LabAsset.js";
import User from "../models/User.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

/**
 * Helper: optionally get user from JWT (does not fail if missing)
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
 * GET /api/labs
 * List labs
 * - Technicians only see their assigned lab
 */
router.get("/", async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const filter = {};

    if (user?.role === "technician" && user.labId) {
      filter._id = user.labId;
    }

    const labs = await Lab.find(filter).sort({ code: 1 });
    res.json(labs);
  } catch (err) {
    console.error("Error fetching labs:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/labs/:id
 * Get lab details (technician access restricted)
 */
router.get("/:id", async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const lab = await Lab.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({ message: "Lab not found" });
    }

    if (
      user?.role === "technician" &&
      user.labId &&
      lab._id.toString() !== user.labId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(lab);
  } catch (err) {
    console.error("Error fetching lab:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/labs
 * Create lab (admin / lab_manager)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const lab = await Lab.create(req.body);
    res.status(201).json(lab);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Lab code already exists" });
    }
    console.error("Error creating lab:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/labs/:labId/assets
 * Get assets assigned to a lab
 */
router.get("/:labId/assets", async (req, res) => {
  try {
    const assignments = await LabAsset.find({
      labId: req.params.labId
    })
      .populate("assetId");

    const result = assignments.map((a) => ({
      _id: a._id,
      assetId: a.assetId._id,
      assetCode:
        a.assetId.billNo || a.assetId.description || String(a.assetId._id).slice(-6),
      description: a.assetId.description,
      billNo: a.assetId.billNo,
      orderId: a.assetId.orderId,
      pageNo: a.assetId.pageNo,
      quantityAssigned: a.quantityAssigned
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching lab assets:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/labs/:labId/assign-asset
 * Assign quantity of an asset to a lab
 */
router.post("/:labId/assign-asset", authenticate, async (req, res) => {
  try {
    const { assetId, quantity } = req.body;
    const { labId } = req.params;

    if (!assetId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: "Invalid assignment data" });
    }

    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const assignedAgg = await LabAsset.aggregate([
      { $match: { assetId: asset._id } },
      { $group: { _id: null, total: { $sum: "$quantityAssigned" } } }
    ]);

    const assignedQty = assignedAgg[0]?.total || 0;
    const remainingQty = asset.quantity - assignedQty;

    if (quantity > remainingQty) {
      return res.status(400).json({
        message: `Only ${remainingQty} units available`
      });
    }

    // Check if asset already assigned to this lab
    let labAsset = await LabAsset.findOne({ labId, assetId });

    if (labAsset) {
      labAsset.quantityAssigned += quantity;
      await labAsset.save();
    } else {
      labAsset = await LabAsset.create({
        labId,
        assetId,
        quantityAssigned: quantity
      });
    }

    res.json({
      message: "Asset assigned successfully",
      assignment: labAsset
    });
  } catch (err) {
    console.error("Error assigning asset:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/labs/:labId/unassign-asset
 * Reduce or remove asset allocation from lab
 */
router.post("/:labId/unassign-asset", authenticate, async (req, res) => {
  try {
    const { assetId, quantity } = req.body;
    const { labId } = req.params;

    const labAsset = await LabAsset.findOne({ labId, assetId });
    if (!labAsset) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (!quantity || quantity >= labAsset.quantityAssigned) {
      await labAsset.deleteOne();
    } else {
      labAsset.quantityAssigned -= quantity;
      await labAsset.save();
    }

    res.json({ message: "Asset unassigned successfully" });
  } catch (err) {
    console.error("Error unassigning asset:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
