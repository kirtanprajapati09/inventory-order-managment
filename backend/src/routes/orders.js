const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

const router = express.Router();

// GET /api/orders
router.get('/', async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders { customerName, customerContact, items: [{ productId, qty }] }
router.post('/', async (req, res, next) => {
  try {
    const { customerName, customerContact, items } = req.body;

    if (!customerName || !customerContact || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Customer name, contact, and at least one item are required',
        },
      });
    }

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const qty = parseInt(item.qty, 10);
      if (!item.productId || isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ITEM',
            message: 'Each item must have a valid productId and qty > 0',
          },
        });
      }

      const product = await Product.findById(item.productId);
      if (!product || product.archived) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: `Product ${item.productId} not found or archived`,
          },
        });
      }

      const itemTotal = product.price * qty;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        qty,
      });
    }

    const order = await Order.create({
      customerName: customerName.trim(),
      customerContact: customerContact.trim(),
      items: orderItems,
      totalAmount,
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status: targetStatus } = req.body;
    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        error: { code: 'STATUS_REQUIRED', message: 'Status is required' },
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      });
    }

    const current = order.status;

    // Check valid transitions
    const isValidTransition =
      (current === 'Pending' && targetStatus === 'Confirmed') ||
      (current === 'Pending' && targetStatus === 'Cancelled') ||
      (current === 'Confirmed' && targetStatus === 'Shipped') ||
      (current === 'Confirmed' && targetStatus === 'Cancelled');

    if (!isValidTransition) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition order status from '${current}' to '${targetStatus}'`,
        },
      });
    }

    const userName = (req.user && (req.user.name || req.user.email)) || 'system';

    // Transition: Pending -> Confirmed
    if (current === 'Pending' && targetStatus === 'Confirmed') {
      let session = null;
      let useSession = true;

      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (sessionErr) {
        useSession = false;
        session = null;
      }

      if (useSession && session) {
        try {
          const movements = [];
          for (const item of order.items) {
            const updated = await Product.findOneAndUpdate(
              { _id: item.product, stock: { $gte: item.qty } },
              { $inc: { stock: -item.qty } },
              { session, new: true }
            );

            if (!updated) {
              await session.abortTransaction();
              session.endSession();
              return res.status(409).json({
                success: false,
                error: {
                  code: 'STOCK_SHORTAGE',
                  message: `Insufficient stock for product "${item.name}" (SKU: ${item.sku})`,
                },
              });
            }

            movements.push({
              product: item.product,
              change: -item.qty,
              reason: `Order #${order._id} Confirmed`,
              user: userName,
              resultingStock: updated.stock,
              time: new Date(),
            });
          }

          if (movements.length > 0) {
            await InventoryMovement.insertMany(movements, { session });
          }

          order.status = 'Confirmed';
          await order.save({ session });
          await session.commitTransaction();
          session.endSession();
        } catch (err) {
          if (session) {
            await session.abortTransaction();
            session.endSession();
          }
          return next(err);
        }
      } else {
        // Fallback without replica set transaction: decrement with compensation rollback
        const decremented = [];
        for (const item of order.items) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.qty } },
            { $inc: { stock: -item.qty } },
            { new: true }
          );

          if (!updated) {
            // Roll back already decremented items
            for (const dec of decremented) {
              await Product.findByIdAndUpdate(dec.productId, { $inc: { stock: dec.qty } });
            }
            return res.status(409).json({
              success: false,
              error: {
                code: 'STOCK_SHORTAGE',
                message: `Insufficient stock for product "${item.name}" (SKU: ${item.sku})`,
              },
            });
          }

          decremented.push({
            productId: item.product,
            qty: item.qty,
            resultingStock: updated.stock,
          });
        }

        // Save movements
        for (const dec of decremented) {
          await InventoryMovement.create({
            product: dec.productId,
            change: -dec.qty,
            reason: `Order #${order._id} Confirmed`,
            user: userName,
            resultingStock: dec.resultingStock,
            time: new Date(),
          });
        }

        order.status = 'Confirmed';
        await order.save();
      }

      return res.json({
        success: true,
        data: order,
      });
    }

    // Transition: Confirmed -> Cancelled
    if (current === 'Confirmed' && targetStatus === 'Cancelled') {
      for (const item of order.items) {
        const updated = await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.qty } },
          { new: true }
        );

        await InventoryMovement.create({
          product: item.product,
          change: item.qty,
          reason: `Order #${order._id} Cancelled (Restock)`,
          user: userName,
          resultingStock: updated ? updated.stock : undefined,
          time: new Date(),
        });
      }

      order.status = 'Cancelled';
      await order.save();

      return res.json({
        success: true,
        data: order,
      });
    }

    // Transition: Pending -> Cancelled OR Confirmed -> Shipped
    order.status = targetStatus;
    await order.save();

    return res.json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
