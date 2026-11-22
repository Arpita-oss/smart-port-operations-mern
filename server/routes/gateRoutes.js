const express = require('express');
const Truck = require('../models/Truck');
const GateTransaction = require('../models/GateTransaction');
const Container = require('../models/Container');
const YardSlot = require('../models/YardSlot');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. Register Truck (Gate Operator / Admin)
router.post('/trucks', verifyToken, authorizeRoles('Gate Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { truckNumber, driverName, company } = req.body;
    const exists = await Truck.findOne({ truckNumber });
    if (exists) return res.status(400).json({ message: `Truck ${truckNumber} is already registered.` });

    const truck = await Truck.create({ truckNumber, driverName, company });
    res.status(201).json(truck);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Get All Trucks & Gate Transactions
router.get('/trucks', verifyToken, async (req, res) => {
  const trucks = await Truck.find().sort({ createdAt: -1 });
  res.json(trucks);
});

router.get('/transactions', verifyToken, async (req, res) => {
  const txns = await GateTransaction.find()
    .populate('truckId', 'truckNumber driverName company')
    .populate('containerId', 'containerNumber status gateApproved')
    .sort({ createdAt: -1 });
  res.json(txns);
});

// 3. Gate-In Processing (Gate Operator / Admin)
router.post('/gate-in', verifyToken, authorizeRoles('Gate Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { truckId } = req.body;
    const activeTxn = await GateTransaction.findOne({ truckId, status: 'IN' });
    if (activeTxn) return res.status(400).json({ message: 'This truck is already inside the port (active Gate-In exists).' });

    const txn = await GateTransaction.create({ truckId, status: 'IN', gateInTime: new Date() });
    res.status(201).json({ message: 'Truck Gate-In recorded.', transaction: txn });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Gate-Out Processing & Pickup Validation (Enforces Rules 5, 6, 9 & 10)
router.post('/gate-out', verifyToken, authorizeRoles('Gate Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { truckId, containerId } = req.body;

    // Rule 10: Must have a matching active Gate-In record
    const txn = await GateTransaction.findOne({ truckId, status: 'IN' });
    if (!txn) {
      return res.status(400).json({ message: 'Gate-Out Blocked (Rule 10): Truck has no matching Gate-In record.' });
    }

    // If picking up a container, validate Rules 5 & 6
    if (containerId) {
      const container = await Container.findById(containerId);
      if (!container) return res.status(404).json({ message: 'Container not found.' });

      if (!container.gateApproved) {
        return res.status(400).json({ message: 'Gate-Out Blocked (Rule 5): Container does not have gate approval.' });
      }
      if (container.status !== 'Ready for Pickup') {
        return res.status(400).json({ message: `Gate-Out Blocked (Rule 6): Container status is "${container.status}", must be "Ready for Pickup".` });
      }

      // Free up the Yard Slot if assigned
      if (container.yardSlotId) {
        await YardSlot.findByIdAndUpdate(container.yardSlotId, { isOccupied: false, containerId: null });
        container.yardSlotId = null;
      }

      // Mark Container Dispatched with Timestamp (Rule 9)
      container.status = 'Dispatched';
      container.statusHistory.push({
        status: 'Dispatched',
        timestamp: new Date(),
        remarks: 'Dispatched via Truck Gate-Out'
      });
      await container.save();
      txn.containerId = container._id;
    }

    txn.status = 'OUT';
    txn.gateOutTime = new Date();
    await txn.save();

    res.json({ message: 'Gate-Out approved and completed!', transaction: txn });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;