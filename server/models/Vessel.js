const mongoose = require('mongoose');

const vesselSchema = new mongoose.Schema({
  vesselId: { type: String, required: true, unique: true, trim: true }, // Rule 1
  vesselName: { type: String, required: true },
  arrivalDate: { type: Date, required: true },
  departureDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Scheduled', 'Arrived', 'Departed'],
    default: 'Scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('Vessel', vesselSchema);