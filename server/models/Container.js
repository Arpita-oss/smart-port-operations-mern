const mongoose = require('mongoose');

const containerSchema = new mongoose.Schema({
  containerNumber: { type: String, required: true, unique: true, trim: true }, // Rule 2
  vesselId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vessel', default: null },
  cargoDetails: { type: String, required: true },
  status: {
    type: String,
    enum: ['In Transit', 'Arrived', 'In Yard', 'Ready for Pickup', 'Dispatched'],
    default: 'Arrived'
  },
  gateApproved: { type: Boolean, default: false }, // Rule 5
  yardSlotId: { type: mongoose.Schema.Types.ObjectId, ref: 'YardSlot', default: null }, // Rule 11
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now }, // Rule 9
      remarks: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Container', containerSchema);