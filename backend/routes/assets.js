import express from 'express';
import Asset from '../models/Asset.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/assets
 * Get all assets with optional filters
 * - labId
 * - status
 */
router.get('/', async (req, res) => {
  try {
    const { labId, status } = req.query;
    const filter = {};

    if (labId) filter.labId = labId;
    if (status) filter.status = status;

    const assets = await Asset.find(filter)
      .populate('labId', 'name code department')
      .sort({ assetTag: 1 });

    const transformedAssets = assets.map(asset => ({
      _id: asset._id,
      assetTag: asset.assetTag,
      labId: asset.labId ? asset.labId._id : null,
      lab: asset.labId || null,
      status: asset.status,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      remarks: asset.remarks
    }));

    res.json(transformedAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/assets/unassigned
 * Get all stock assets (not assigned to any lab)
 */
router.get('/unassigned', async (req, res) => {
  try {
    const assets = await Asset.find({ labId: null })
      .sort({ assetTag: 1 });

    const transformedAssets = assets.map(asset => ({
      _id: asset._id,
      assetTag: asset.assetTag,
      status: asset.status,
      model: asset.model,
      serialNumber: asset.serialNumber
    }));

    res.json(transformedAssets);
  } catch (error) {
    console.error('Error fetching unassigned assets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/assets/:id
 * Get single asset
 */
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('labId', 'name code department location');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    res.json({
      _id: asset._id,
      assetTag: asset.assetTag,
      labId: asset.labId ? asset.labId._id : null,
      lab: asset.labId || null,
      status: asset.status,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      remarks: asset.remarks
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/assets
 * Create asset (GLOBAL STOCK — no lab assignment)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      assetTag,
      status,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      remarks
    } = req.body;

    const asset = new Asset({
      assetTag,
      status,
      model,
      serialNumber,
      purchaseDate,
      warrantyExpiry,
      remarks,
      labId: null // 🔑 IMPORTANT
    });

    await asset.save();

    res.status(201).json({
      _id: asset._id,
      assetTag: asset.assetTag,
      labId: null,
      lab: null,
      status: asset.status,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      remarks: asset.remarks
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Asset tag already exists' });
    }
    console.error('Error creating asset:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
