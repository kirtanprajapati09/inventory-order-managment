require('dotenv').config();
const dns = require('node:dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if custom DNS setup fails
}
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const movementRoutes = require('./routes/movements');
const dashboardRoutes = require('./routes/dashboard');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin,
    credentials: true,
  })
);
app.use(express.json());

// Public Auth routes
app.use('/api/auth', authRoutes);

// Protected routes (apply authMiddleware)
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/orders', authMiddleware, orderRoutes);
app.use('/api/movements', authMiddleware, movementRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'healthy', timestamp: new Date() } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` },
  });
});

// Central error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MONGO_URI is not set in environment variables.');
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`Connected to MongoDB Atlas successfully`);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
