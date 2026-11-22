const express = require('express');
const Vessel = require('../models/Vessel');
const Container = require('../models/Container');
const YardSlot = require('../models/YardSlot');
const GateTransaction = require('../models/GateTransaction');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/summary', verifyToken, async (req, res) => {
  try {
    // 1. Vessel Operations Summary
    const vessels = await Vessel.find();
    const vesselStats = {
      total: vessels.length,
      Scheduled: vessels.filter(v => v.status === 'Scheduled').length,
      Arrived: vessels.filter(v => v.status === 'Arrived').length,
      Departed: vessels.filter(v => v.status === 'Departed').length
    };

    // 2. Container Monitoring Summary
    const containers = await Container.find().populate('vesselId', 'vesselId vesselName').populate('yardSlotId', 'slotCode');
    const containerStats = {
      total: containers.length,
      'In Transit': containers.filter(c => c.status === 'In Transit').length,
      Arrived: containers.filter(c => c.status === 'Arrived').length,
      'In Yard': containers.filter(c => c.status === 'In Yard').length,
      'Ready for Pickup': containers.filter(c => c.status === 'Ready for Pickup').length,
      Dispatched: containers.filter(c => c.status === 'Dispatched').length
    };

    // 3. Yard Occupancy Report
    const totalSlots = await YardSlot.countDocuments();
    const occupiedSlots = await YardSlot.countDocuments({ isOccupied: true });
    const vacantSlots = totalSlots - occupiedSlots;
    const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

    // 4. Pending Pickup Report
    const pendingPickups = containers.filter(c => c.status === 'Ready for Pickup');

    // 5. Gate Activity Report
    const gateTransactions = await GateTransaction.find()
      .populate('truckId', 'truckNumber driverName company')
      .populate('containerId', 'containerNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    const activeTrucksInside = await GateTransaction.countDocuments({ status: 'IN' });

    res.json({
      vesselStats,
      containerStats,
      yardStats: { totalSlots, occupiedSlots, vacantSlots, occupancyRate },
      pendingPickups,
      gateStats: { activeTrucksInside, recentTransactions: gateTransactions }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;