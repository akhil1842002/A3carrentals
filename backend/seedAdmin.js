require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const User = require('./models/User');

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin seed details
    const adminData = {
      username: 'admin',
      email: 'Shajanshaji111@gmail.com',
      password: 'Password@123',
      name: 'A3 Car Rentals Admin',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    // 1. Check if admin exists in Admin collection
    let existingAdmin = await Admin.findOne({
      $or: [
        { username: adminData.username },
        { email: adminData.email }
      ]
    });

    if (existingAdmin) {
      existingAdmin.role = 'admin';
      existingAdmin.name = adminData.name;
      existingAdmin.avatar = adminData.avatar;
      existingAdmin.password = adminData.password; // pre-save will re-hash
      await existingAdmin.save();
      console.log('🔄 Existing Admin updated with role: admin');
    } else {
      const newAdmin = new Admin(adminData);
      await newAdmin.save();
      console.log('✨ New Admin account created with role: admin');
    }

    // 2. Also ensure User collection has role: admin for unified admin access
    let adminUser = await User.findOne({ email: adminData.email });
    if (adminUser) {
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('🔄 Associated User document updated to role: admin');
    }

    console.log('\n=============================================');
    console.log('🔑 Admin Credentials:');
    console.log(`   Username : ${adminData.username}`);
    console.log(`   Email    : ${adminData.email}`);
    console.log(`   Password : ${adminData.password}`);
    console.log(`   Role     : ${adminData.role}`);
    console.log('=============================================\n');

    await mongoose.disconnect();
    console.log('✅ Admin seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
  }
}

seedAdmin();
