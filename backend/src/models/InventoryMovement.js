const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    change: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: String,
      default: 'system',
    },
    resultingStock: {
      type: Number,
    },
    time: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

inventoryMovementSchema.index({ product: 1, time: -1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
