    const mongoose = require('mongoose');

const yardSlotSchema = new mongoose.Schema({
  slotCode: { type: String, required: true, unique: true, trim: true }, // e.g., A-01
  zone: { type: String, default: 'Zone A' },
  isOccupied: { type: Boolean, default: false }, // Rules 3 & 4
  containerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Container', default: null }
}, { timestamps: true });

module.exports = mongoose.model('YardSlot', yardSlotSchema);        