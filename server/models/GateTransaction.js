const mongoose = require('mongoose');

const gateTransactionSchema = new mongoose.Schema({
  truckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
  containerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Container', default: null },
  gateInTime: { type: Date, default: Date.now },
  gateOutTime: { type: Date, default: null },
  status: { type: String, enum: ['IN', 'OUT'], default: 'IN' } // Rule 10
}, { timestamps: true });

module.exports = mongoose.model('GateTransaction', gateTransactionSchema);