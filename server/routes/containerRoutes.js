const express = require('express');
const Container = require('../models/Container');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. Register Container (Operations Officer / Admin)
router.post('/', verifyToken, authorizeRoles('Operations Officer', 'Port Administrator'), async (req, res) => {
  try {
    const { containerNumber, vesselId, cargoDetails, status } = req.body;
    const exists = await Container.findOne({ containerNumber });
    if (exists) return res.status(400).json({ message: `Container ${containerNumber} already exists (Rule 2).` });

    const initialStatus = status || 'Arrived';
    const container = await Container.create({
      containerNumber,
      vesselId: vesselId || null,
      cargoDetails,
      status: initialStatus,
      statusHistory: [{ status: initialStatus, timestamp: new Date(), remarks: 'Container registered' }] // Rule 9
    });

    res.status(201).json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. View & Search Containers (All logged-in users)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) {
      query.containerNumber = { $regex: search, $options: 'i' };
    }
    const containers = await Container.find(query)
      .populate('vesselId', 'vesselId vesselName')
      .sort({ createdAt: -1 });
    res.json(containers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Update Container Status & Gate Approval (Rule 9: logs timestamped history)
router.patch('/:id/status', verifyToken, authorizeRoles('Operations Officer', 'Port Administrator'), async (req, res) => {
  try {
    const { status, gateApproved, remarks } = req.body;
    const container = await Container.findById(req.params.id);
    if (!container) return res.status(404).json({ message: 'Container not found' });

    if (status && status !== container.status) {
      container.status = status;
      container.statusHistory.push({
        status,
        timestamp: new Date(),
        remarks: remarks || `Status updated to ${status}`
      });
    }

    if (typeof gateApproved === 'boolean') {
      container.gateApproved = gateApproved;
    }

    await container.save();
    res.json(container);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;