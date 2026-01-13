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

    // Sort by assetTag (fallback to createdAt) instead of deprecated slNo
    const assets = await Asset.find().sort({ assetTag: 1, createdAt: 1 });

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
          purchaseDate: asset.purchaseDate,
          pageNo: asset.pageNo,
          model: asset.model,
          quantity: asset.quantity,
          assignedQuantity: assignedQty,
          remainingQuantity: asset.quantity - assignedQty,
          cost: asset.cost,
          remarks: asset.remarks,
          assetTag: asset.assetTag,
          status: asset.status,
          labId: asset.labId,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt
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
      assetTag: asset.assetTag,
      purchaseDate: asset.purchaseDate,
      pageNo: asset.pageNo,
      model: asset.model,
      quantity: asset.quantity,
      assignedQuantity: assignedQty,
      remainingQuantity: asset.quantity - assignedQty,
      cost: asset.cost,
      remarks: asset.remarks,
      status: asset.status,
      labId: asset.labId,
      allocations: allocations.map((a) => ({
        lab: a.labId,
        quantityAssigned: a.quantityAssigned
      })),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
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
  console.log('=== ASSET CREATION REQUEST ===');
  console.log('Request body received:', JSON.stringify(req.body, null, 2));
  
  // Debug: Check if body is parsed correctly
  if (typeof req.body === 'string') {
    console.log('Body received as string, attempting to parse...');
    try {
      req.body = JSON.parse(req.body);
      console.log('Successfully parsed body:', req.body);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      return res.status(400).json({ 
        error: 'Invalid JSON format',
        message: 'Request body must be valid JSON'
      });
    }
  }
  
  console.log('Parsed body keys:', Object.keys(req.body || {}));
  
  try {
    // Extract fields from request
    const {
      assetTag,
      pageNo,
      model,
      quantity,
      cost,
      purchaseDate,
      remarks,
      labId,
      status
    } = req.body;

    // Validate required fields
    const requiredFields = ['assetTag', 'pageNo', 'model', 'quantity', 'cost'];
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing: missingFields,
        message: `Please provide: ${missingFields.join(', ')}`
      });
    }

    // Create asset (no `assetId` field)
    const asset = await Asset.create({
      assetTag: assetTag.trim(),
      pageNo: Number(pageNo),
      model: model.trim(),
      quantity: Number(quantity),
      cost: Number(cost),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      remarks: remarks ? remarks.trim() : '',
      labId: labId || null,
      status: status || 'WORKING'
    });

    res.status(201).json({
      _id: asset._id,
      assetTag: asset.assetTag,
      pageNo: asset.pageNo,
      model: asset.model,
      quantity: asset.quantity,
      cost: asset.cost,
      purchaseDate: asset.purchaseDate,
      remarks: asset.remarks,
      status: asset.status,
      labId: asset.labId,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt
    });
    
  } catch (err) {
    console.error('❌ Asset creation error details:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyValue)[0];
      const value = Object.values(err.keyValue)[0];
      console.error(`Duplicate ${field}: ${value}`);
      
      return res.status(400).json({
        error: 'Duplicate entry',
        message: `${field} "${value}" already exists`,
        field,
        value,
        suggestion: 'Please use a unique value'
      });
    }
    
    if (err.name === 'ValidationError') {
      console.error('Validation errors:');
      const errors = {};
      Object.keys(err.errors).forEach(key => {
        errors[key] = err.errors[key].message;
        console.error(`  ${key}: ${err.errors[key].message}`);
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
        message: 'Please check the input data'
      });
    }
    
    // Handle type conversion errors
    if (err.message.includes('Cast to Number failed')) {
      return res.status(400).json({
        error: 'Type conversion error',
        message: 'Please ensure pageNo, quantity, and cost are valid numbers',
        details: err.message
      });
    }
    
    console.error('Unexpected error:', err);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create asset. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

/**
 * PUT /api/assets/:id
 * Update an asset
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      assetTag,
      pageNo,
      model,
      quantity,
      cost,
      purchaseDate,
      remarks,
      labId,
      status
    } = req.body;

    const updateData = {};
    if (assetTag !== undefined) updateData.assetTag = assetTag;
    if (pageNo !== undefined) updateData.pageNo = pageNo;
    if (model !== undefined) updateData.model = model;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (cost !== undefined) updateData.cost = cost;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate;
    if (remarks !== undefined) updateData.remarks = remarks;
    if (labId !== undefined) updateData.labId = labId;
    if (status !== undefined) updateData.status = status;

    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(asset);
  } catch (err) {
    console.error("Error updating asset:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Asset Tag already exists"
      });
    }
    
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE /api/assets/:id
 * Delete an asset
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Check if asset has lab allocations
    const allocations = await LabAsset.find({ assetId: req.params.id });
    if (allocations.length > 0) {
      return res.status(400).json({
        message: "Cannot delete asset with existing lab allocations",
        allocationCount: allocations.length
      });
    }

    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ 
      message: "Asset deleted successfully",
      deletedAsset: {
        assetTag: asset.assetTag,
        model: asset.model
      }
    });
  } catch (err) {
    console.error("Error deleting asset:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;