const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// ─── CHANGE THESE CREDENTIALS ───────────────────────────────────────────────
const ADMIN_NAME     = 'Admin';
const ADMIN_EMAIL    = 'admin@ecowastefinder.com';
const ADMIN_PASSWORD = 'Admin@1234';
// ─────────────────────────────────────────────────────────────────────────────

const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected...');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
      process.exit(0);
    }

    const admin = await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
      isActive: true,
      location: { type: 'Point', coordinates: [0, 0] },
    });

    console.log('✅ Admin created successfully!');
    console.log(`   Name  : ${admin.name}`);
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seed();