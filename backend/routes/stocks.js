import express from 'express';
import jwt from 'jsonwebtoken';
import Stock from '../models/Stock.js';
import User from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper function to optionally get user from token
async function getOptionalUser(req) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch (err) {
    return null;
  }
}

/**
 * GET /api/stocks
 * Get all stocks with optional filters
 * - labId
 * Technicians only see stocks from their assigned lab
 */
router.get('/', async (req, res) => {
  try {
    const user = await getOptionalUser(req);
    const { labId } = req.query;
    const filter = {};

    // If user is a technician, only show stocks from their assigned lab
    if (user && user.role === 'technician' && user.labId) {
      filter.labId = user.labId;
    } else if (labId) {
      filter.labId = labId;
    }

    const stocks = await Stock.find(filter)
      .populate('labId', 'name code department')
      .sort({ stockId: 1 });

    const transformedStocks = stocks.map(stock => ({
      _id: stock._id,
      stockId: stock.stockId,
      quantity: stock.quantity,
      purchaseDate: stock.purchaseDate,
      labId: stock.labId ? stock.labId._id : null,
      lab: stock.labId || null,
      remarks: stock.remarks
    }));

    res.json(transformedStocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/stocks/:id
 * Get single stock
 */
router.get('/:id', async (req, res) => {
  try {
    const stock = await Stock.findById(req.params.id)
      .populate('labId', 'name code department location');

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    res.json({
      _id: stock._id,
      stockId: stock.stockId,
      quantity: stock.quantity,
      purchaseDate: stock.purchaseDate,
      labId: stock.labId ? stock.labId._id : null,
      lab: stock.labId || null,
      remarks: stock.remarks
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/stocks
 * Create stock (Admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      stockId,
      quantity,
      purchaseDate,
      labId,
      remarks
    } = req.body;

    const stock = new Stock({
      stockId,
      quantity,
      purchaseDate,
      labId: labId || null,
      remarks
    });

    await stock.save();

    const populatedStock = await Stock.findById(stock._id)
      .populate('labId', 'name code department');

    res.status(201).json({
      _id: populatedStock._id,
      stockId: populatedStock.stockId,
      quantity: populatedStock.quantity,
      purchaseDate: populatedStock.purchaseDate,
      labId: populatedStock.labId ? populatedStock.labId._id : null,
      lab: populatedStock.labId || null,
      remarks: populatedStock.remarks
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Stock ID already exists' });
    }
    console.error('Error creating stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/stocks/:id/assign
 * Assign part or all of a stock to a lab. If assigning less than available quantity,
 * split the stock: create a new stock record assigned to the lab with the
 * requested quantity and leave the remainder as an unassigned stock.
 */
router.post('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { labId, quantity } = req.body;
    const assignQty = parseInt(quantity, 10);

    if (!labId) return res.status(400).json({ message: 'labId is required' });
    if (!assignQty || assignQty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    if (assignQty > stock.quantity) {
      return res.status(400).json({ message: 'Assign quantity exceeds available stock' });
    }

    // If assigning the entire stock, simply set labId
    if (assignQty === stock.quantity) {
      stock.labId = labId;
      await stock.save();

      const populated = await Stock.findById(stock._id).populate('labId', 'name code department');
      return res.json({ message: 'Stock assigned', stock: populated });
    }

    // Partial assignment: reduce original stock and create new assigned stock
    stock.quantity = stock.quantity - assignQty;
    stock.labId = null; // ensure original remains unassigned
    await stock.save();

    // create a new unique stockId for the assigned portion
    const newStockId = `${stock.stockId}-${Date.now()}`;
    const newStock = new Stock({
      stockId: newStockId,
      quantity: assignQty,
      purchaseDate: stock.purchaseDate,
      labId,
      remarks: stock.remarks
    });
    await newStock.save();

    const assignedPopulated = await Stock.findById(newStock._id).populate('labId', 'name code department');
    const originalPopulated = await Stock.findById(stock._id).populate('labId', 'name code department');

    res.json({ message: 'Partial stock assigned', assigned: assignedPopulated, remaining: originalPopulated });
  } catch (error) {
    console.error('Error assigning stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/stocks/:id
 * Update stock (Admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const {
      stockId,
      quantity,
      purchaseDate,
      labId,
      remarks
    } = req.body;

    const stock = await Stock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.stockId = stockId || stock.stockId;
    stock.quantity = quantity !== undefined ? quantity : stock.quantity;
    stock.purchaseDate = purchaseDate || stock.purchaseDate;
    stock.labId = labId !== undefined ? labId : stock.labId;
    stock.remarks = remarks !== undefined ? remarks : stock.remarks;

    await stock.save();

    const populatedStock = await Stock.findById(stock._id)
      .populate('labId', 'name code department');

    res.json({
      _id: populatedStock._id,
      stockId: populatedStock.stockId,
      quantity: populatedStock.quantity,
      purchaseDate: populatedStock.purchaseDate,
      labId: populatedStock.labId ? populatedStock.labId._id : null,
      lab: populatedStock.labId || null,
      remarks: populatedStock.remarks
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Stock ID already exists' });
    }
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/stocks/:id
 * Delete stock (Admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json({ message: 'Stock deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

