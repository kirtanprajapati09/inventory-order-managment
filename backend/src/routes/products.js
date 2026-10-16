const express = require('express');
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

const router = express.Router();

// GET /api/products/low-stock (stock <= 10)
router.get('/low-stock', async (req, res, next) => {
  try {
    const products = await Product.find({
      archived: { $ne: true },
      stock: { $lte: 10 },
    }).sort({ stock: 1 });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { archived: { $ne: true } });
    return res.json({
      success: true,
      data: categories.filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products (search by name/sku, filter by category)
router.get('/', async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = { archived: { $ne: true } };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { sku: searchRegex }];
    }

    if (category && category.trim()) {
      query.category = category.trim();
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.archived) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const { name, sku, description, category, price, stock } = req.body;
    if (!name || !sku || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, SKU, category, and price are required' },
      });
    }

    const cleanSku = sku.trim().toUpperCase();
    const existing = await Product.findOne({ sku: cleanSku, archived: { $ne: true } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'SKU_EXISTS', message: 'A product with this SKU already exists' },
      });
    }

    const initialStock = Math.max(0, parseInt(stock, 10) || 0);

    const product = await Product.create({
      name: name.trim(),
      sku: cleanSku,
      description: description ? description.trim() : '',
      category: category.trim(),
      price: Math.max(0, Number(price)),
      stock: initialStock,
    });

    if (initialStock > 0) {
      await InventoryMovement.create({
        product: product._id,
        change: initialStock,
        reason: 'Initial stock',
        user: (req.user && (req.user.name || req.user.email)) || 'user',
        resultingStock: initialStock,
        time: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { name, sku, description, category, price } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product || product.archived) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    if (sku) {
      const cleanSku = sku.trim().toUpperCase();
      const existing = await Product.findOne({
        sku: cleanSku,
        _id: { $ne: product._id },
        archived: { $ne: true },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: { code: 'SKU_EXISTS', message: 'Another product with this SKU already exists' },
        });
      }
      product.sku = cleanSku;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category) product.category = category.trim();
    if (price !== undefined) product.price = Math.max(0, Number(price));

    await product.save();

    return res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.archived) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' },
      });
    }

    product.archived = true;
    await product.save();

    return res.json({
      success: true,
      data: { message: 'Product deleted successfully', id: product._id },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products/:id/adjust { delta, reason }
router.post('/:id/adjust', async (req, res, next) => {
  try {
    const delta = parseInt(req.body.delta, 10);
    const reason = req.body.reason;

    if (isNaN(delta) || delta === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DELTA', message: 'Delta must be a non-zero integer' },
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'REASON_REQUIRED', message: 'Reason is required for stock adjustment' },
      });
    }

    // Atomic update: only update if current stock >= -delta (preventing negative stock)
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: -delta }, archived: { $ne: true } },
      { $inc: { stock: delta } },
      { new: true }
    );

    if (!product) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'STOCK_CONFLICT',
          message: 'Insufficient stock or product not found',
        },
      });
    }

    const movement = await InventoryMovement.create({
      product: product._id,
      change: delta,
      reason: reason.trim(),
      user: (req.user && (req.user.name || req.user.email)) || 'system',
      resultingStock: product.stock,
      time: new Date(),
    });

    return res.json({
      success: true,
      data: {
        product,
        movement,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
