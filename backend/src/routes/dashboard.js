const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');

const router = express.Router();

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const [totalProducts, lowStockCount, totalOrders, ordersByStatusRaw, recentOrders] =
      await Promise.all([
        Product.countDocuments({ archived: { $ne: true } }),
        Product.countDocuments({ archived: { $ne: true }, stock: { $lte: 10 } }),
        Order.countDocuments(),
        Order.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Order.find().sort({ createdAt: -1 }).limit(5),
      ]);

    const countsByStatus = {
      Pending: 0,
      Confirmed: 0,
      Shipped: 0,
      Cancelled: 0,
    };

    ordersByStatusRaw.forEach((entry) => {
      if (entry._id && countsByStatus[entry._id] !== undefined) {
        countsByStatus[entry._id] = entry.count;
      }
    });

    return res.json({
      success: true,
      data: {
        totalProducts,
        lowStockCount,
        totalOrders,
        countsByStatus,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
