const express = require('express');
const InventoryMovement = require('../models/InventoryMovement');

const router = express.Router();

// GET /api/movements
router.get('/', async (req, res, next) => {
  try {
    const { product, reason } = req.query;
    const query = {};

    if (product) {
      query.product = product;
    }

    if (reason && reason.trim()) {
      query.reason = new RegExp(reason.trim(), 'i');
    }

    const movements = await InventoryMovement.find(query)
      .populate('product', 'name sku category')
      .sort({ time: -1, createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      data: movements,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
