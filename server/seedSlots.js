require('dotenv').config();
const mongoose = require('mongoose');
const YardSlot = require('./models/YardSlot');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await YardSlot.deleteMany({});
  const slots = [];
  for (let i = 1; i <= 12; i++) {
    slots.push({
      slotCode: `A-${i.toString().padStart(2, '0')}`,
      zone: i <= 6 ? 'Zone A' : 'Zone B'
    });
  }
  await YardSlot.insertMany(slots);
  console.log('✅ 12 Yard Slots (A-01 to A-12) created!');
  process.exit();
};
run();