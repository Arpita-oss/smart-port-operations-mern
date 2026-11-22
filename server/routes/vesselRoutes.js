const express = require('express');
const Vessel = require('../models/Vessel');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. Register Vessel (Operations Officer / Admin)
router.post('/', verifyToken, authorizeRoles('Operations Officer', 'Port Administrator'), async (req, res) => {
  try {
    const { vesselId, vesselName, arrivalDate, departureDate, status } = req.body;
    const exists = await Vessel.findOne({ vesselId });
    if (exists) return res.status(400).json({ message: `Vessel ID ${vesselId} already exists (Rule 1).` });

    const vessel = await Vessel.create({ vesselId, vesselName, arrivalDate, departureDate, status });
    res.status(201).json(vessel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. View & Search Vessels (All logged-in users)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { vesselId: { $regex: search, $options: 'i' } },
        { vesselName: { $regex: search, $options: 'i' } }
      ];
    }
    const vessels = await Vessel.find(query).sort({ createdAt: -1 });
    res.json(vessels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Update Vessel Status (Operations Officer / Admin)
router.patch('/:id/status', verifyToken, authorizeRoles('Operations Officer', 'Port Administrator'), async (req, res) => {
  try {
    const vessel = await Vessel.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(vessel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Delete Vessel (Rule 7: Does NOT delete associated containers!)
router.delete('/:id', verifyToken, authorizeRoles('Operations Officer', 'Port Administrator'), async (req, res) => {
  try {
    await Vessel.findByIdAndDelete(req.params.id);
    // Notice: We intentionally do NOT call Container.deleteMany({ vesselId: req.params.id })
    res.json({ message: 'Vessel deleted. Associated container records safely preserved (Rule 7).' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;