const express = require('express');
const YardSlot = require('../models/YardSlot');
const Container = require('../models/Container');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// 1. Create Yard Slot (Yard Operator / Admin)
router.post('/slots', verifyToken, authorizeRoles('Yard Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { slotCode, zone } = req.body;
    const exists = await YardSlot.findOne({ slotCode });
    if (exists) return res.status(400).json({ message: `Slot ${slotCode} already exists.` });

    const slot = await YardSlot.create({ slotCode, zone: zone || 'Zone A' });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. View All Yard Slots & Occupancy (All logged-in users)
router.get('/slots', verifyToken, async (req, res) => {
  try {
    const slots = await YardSlot.find()
      .populate('containerId', 'containerNumber cargoDetails status gateApproved')
      .sort({ slotCode: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Assign Container to Slot (Enforces Rules 3, 4, 9 & 11)
router.post('/assign', verifyToken, authorizeRoles('Yard Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { slotId, containerId } = req.body;
    const slot = await YardSlot.findById(slotId);
    const container = await Container.findById(containerId);

    if (!slot || !container) return res.status(404).json({ message: 'Slot or Container not found.' });
    if (slot.isOccupied) return res.status(400).json({ message: `Slot ${slot.slotCode} is already occupied (Rules 3 & 4).` });
    if (container.yardSlotId) return res.status(400).json({ message: `Container ${container.containerNumber} is already in a slot. Use Relocate instead (Rule 11).` });

    slot.isOccupied = true;
    slot.containerId = container._id;
    await slot.save();

    container.yardSlotId = slot._id;
    container.status = 'In Yard';
    container.statusHistory.push({ status: 'In Yard', timestamp: new Date(), remarks: `Assigned to slot ${slot.slotCode}` });
    await container.save();

    res.json({ message: `Container ${container.containerNumber} assigned to ${slot.slotCode}`, slot, container });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Relocate Container to Another Slot (Enforces Rules 3, 4 & 9)
router.post('/relocate', verifyToken, authorizeRoles('Yard Operator', 'Port Administrator'), async (req, res) => {
  try {
    const { containerId, newSlotId } = req.body;
    const container = await Container.findById(containerId);
    const newSlot = await YardSlot.findById(newSlotId);

    if (!container || !newSlot) return res.status(404).json({ message: 'Container or New Slot not found.' });
    if (!container.yardSlotId) return res.status(400).json({ message: 'Container is not currently assigned to any yard slot.' });
    if (newSlot.isOccupied) return res.status(400).json({ message: `Target slot ${newSlot.slotCode} is occupied (Rules 3 & 4).` });

    // Free the old slot
    const oldSlot = await YardSlot.findById(container.yardSlotId);
    if (oldSlot) {
      oldSlot.isOccupied = false;
      oldSlot.containerId = null;
      await oldSlot.save();
    }

    // Occupy the new slot
    newSlot.isOccupied = true;
    newSlot.containerId = container._id;
    await newSlot.save();

    container.yardSlotId = newSlot._id;
    container.statusHistory.push({
      status: container.status,
      timestamp: new Date(),
      remarks: `Relocated from ${oldSlot ? oldSlot.slotCode : 'previous slot'} to ${newSlot.slotCode}`
    });
    await container.save();

    res.json({ message: `Relocated ${container.containerNumber} to ${newSlot.slotCode}`, newSlot, container });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;