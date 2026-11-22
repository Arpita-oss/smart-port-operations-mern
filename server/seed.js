require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!');

    // Clear old users if any exist
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create the 5 required stakeholders from the case study
    const users = [
      { name: 'Admin User', email: 'admin@port.com', password: hashedPassword, role: 'Port Administrator' },
      { name: 'Ops Officer', email: 'ops@port.com', password: hashedPassword, role: 'Operations Officer' },
      { name: 'Yard Operator', email: 'yard@port.com', password: hashedPassword, role: 'Yard Operator' },
      { name: 'Gate Operator', email: 'gate@port.com', password: hashedPassword, role: 'Gate Operator' },
      { name: 'Ops Manager', email: 'manager@port.com', password: hashedPassword, role: 'Operations Manager' }
    ];

    await User.insertMany(users);
    console.log('🎉 Success! All 5 user roles created in MongoDB.');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedUsers();