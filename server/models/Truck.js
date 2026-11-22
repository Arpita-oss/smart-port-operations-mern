const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  truckNumber: { type: String, required: true, unique: true, trim: true },
  driverName: { type: String, required: true },
  company: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Truck', truckSchema);