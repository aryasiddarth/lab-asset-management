import express from 'express';
import Lab from '../models/Lab.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all labs
router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ code: 1 });
    res.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lab by ID
router.get('/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json(lab);
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create lab (protected)
router.post('/', authenticate, async (req, res) => {
  try {
    const lab = new Lab(req.body);
    await lab.save();
    res.status(201).json(lab);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Lab code already exists' });
    }
    console.error('Error creating lab:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post("/:labId/assign-asset", async (req, res) => {
  const { labId } = req.params;
  const { assetId } = req.body;

  const asset = await Asset.findById(assetId);
  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  if (asset.labId) {
    return res.status(400).json({ message: "Asset already assigned" });
  }

  asset.labId = labId;
  await asset.save();

  res.json({ message: "Asset assigned", asset });
});

router.post("/:labId/unassign-asset", async (req, res) => {
  const { assetId } = req.body;

  const asset = await Asset.findById(assetId);
  if (!asset) {
    return res.status(404).json({ message: "Asset not found" });
  }

  asset.labId = null;
  await asset.save();

  res.json({ message: "Asset unassigned", asset });
});

export default router;

