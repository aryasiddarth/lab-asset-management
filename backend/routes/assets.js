import express from 'express';
import Asset from '../models/Asset.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all assets with optional filters
router.get('/', async (req, res) => {
  try {
    const { labId, status } = req.query;
    const filter = {};
    
    if (labId) filter.labId = labId;
    if (status) filter.status = status;

    const assets = await Asset.find(filter)
      .populate('labId', 'name code department')
      .sort({ assetTag: 1 });
    
    // Transform to match frontend expectations
    const transformedAssets = assets.map(asset => ({
      _id: asset._id,
      assetTag: asset.assetTag,
      labId: asset.labId._id,
      lab: asset.labId,
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

// Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('labId', 'name code department location');
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Transform to match frontend expectations
    const transformedAsset = {
      _id: asset._id,
      assetTag: asset.assetTag,
      lab: asset.labId,
      status: asset.status,
      model: asset.model,
      serialNumber: asset.serialNumber,
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      remarks: asset.remarks
    };

    res.json(transformedAsset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create asset (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const asset = new Asset(req.body);
    await asset.save();
    
    const populatedAsset = await Asset.findById(asset._id)
      .populate('labId', 'name code department');
    
    res.status(201).json({
      _id: populatedAsset._id,
      assetTag: populatedAsset.assetTag,
      labId: populatedAsset.labId._id,
      lab: populatedAsset.labId,
      status: populatedAsset.status,
      model: populatedAsset.model,
      serialNumber: populatedAsset.serialNumber,
      purchaseDate: populatedAsset.purchaseDate,
      warrantyExpiry: populatedAsset.warrantyExpiry,
      remarks: populatedAsset.remarks
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

