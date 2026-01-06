import express from 'express';
import jwt from 'jsonwebtoken';
import Lab from '../models/Lab.js';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper function to optionally get user from token (doesn't fail if no token)
async function getOptionalUser(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (err) {
    return null; // Ignore auth errors
  }
}

// Get all labs (filtered by technician if technician role)
router.get('/', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    let filter = {};
    
    // If user is a technician, only show their assigned lab
    if (user && user.role === 'technician' && user.labId) {
      filter._id = user.labId;
    }
    
    const labs = await Lab.find(filter).sort({ code: 1 });
    res.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lab by ID (with technician access check)
router.get('/:id', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const lab = await Lab.findById(req.params.id);
    
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    
    // If user is a technician, only allow access to their assigned lab
    if (user && user.role === 'technician' && user.labId) {
      if (lab._id.toString() !== user.labId.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
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

