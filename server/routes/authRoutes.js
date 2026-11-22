const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. USER LOGIN (Public)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated. Contact Port Administrator.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. REGISTER NEW USER (Rule 12: Only Port Administrator can create users)
router.post('/register', verifyToken, authorizeRoles('Port Administrator'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, isActive: newUser.isActive }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. GET ALL USERS (Port Administrator only)
router.get('/users', verifyToken, authorizeRoles('Port Administrator'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. ACTIVATE / DEACTIVATE USER OR CHANGE ROLE (Rule 12: Port Administrator only)
router.patch('/users/:id', verifyToken, authorizeRoles('Port Administrator'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { ...(role && { role }), ...(typeof isActive === 'boolean' && { isActive }) },
      { new: true }
    ).select('-password');

    res.json({ message: 'User updated', user: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. PROFILE MANAGEMENT (Any logged-in user can view/update their own name)
router.get('/profile', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

router.put('/profile', verifyToken, async (req, res) => {
  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name },
    { new: true }
  ).select('-password');
  res.json(updated);
});

module.exports = router;