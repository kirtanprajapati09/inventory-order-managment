const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Name, email, and password are required' },
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'A user with this email already exists' },
      });
    }

    const count = await User.countDocuments();
    const role = count === 0 ? 'admin' : 'staff';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    return res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
