const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const Car = require('./models/Car');
const Driver = require('./models/Driver');
const User = require('./models/User');
const Notification = require('./models/Notification');
const Review = require('./models/Review');
const Tyre = require('./models/Tyre');
const TyreOrder = require('./models/TyreOrder');
const Admin = require('./models/Admin');
const Settings = require('./models/Settings');

async function cleanSampleData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/carbook';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('--- Cleaning Sample Data ---');

    // 1. Vehicles / Cars
    const carRes = await Car.deleteMany({});
    console.log(`Deleted ${carRes.deletedCount} vehicles/cars.`);

    // 2. Bookings
    const bookingRes = await Booking.deleteMany({});
    console.log(`Deleted ${bookingRes.deletedCount} bookings.`);

    // 3. Drivers
    const driverRes = await Driver.deleteMany({});
    console.log(`Deleted ${driverRes.deletedCount} drivers.`);

    // 4. Customers / Users (Keep akhil1842002@gmail.com)
    const userRes = await User.deleteMany({ email: { $ne: 'akhil1842002@gmail.com' } });
    console.log(`Deleted ${userRes.deletedCount} sample customer users. Kept account: akhil1842002@gmail.com`);

    // Ensure Akhil's user has no dangling driverProfile
    await User.updateOne({ email: 'akhil1842002@gmail.com' }, { $unset: { driverProfile: 1 } });

    // 5. Notifications
    const notifRes = await Notification.deleteMany({});
    console.log(`Deleted ${notifRes.deletedCount} notifications.`);

    // 6. Reviews
    const reviewRes = await Review.deleteMany({});
    console.log(`Deleted ${reviewRes.deletedCount} reviews.`);

    // 7. Tyres & Tyre Orders
    const tyreRes = await Tyre.deleteMany({});
    console.log(`Deleted ${tyreRes.deletedCount} tyre catalogue items.`);

    const orderRes = await TyreOrder.deleteMany({});
    console.log(`Deleted ${orderRes.deletedCount} tyre orders.`);

    // Check remaining collections & counts
    console.log('\n--- Final Database Status ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const c of collections) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log(`${c.name}: ${count}`);
    }

    const remainingUsers = await User.find({}, 'name email role');
    console.log('\nRemaining Users:', remainingUsers);

    const remainingAdmins = await Admin.find({}, 'username email name');
    console.log('Remaining Admins:', remainingAdmins);

    const settingsCount = await Settings.countDocuments();
    console.log('Settings preserved:', settingsCount === 1 ? 'Yes (A3rentals)' : 'None');

    await mongoose.disconnect();
    console.log('\nSample data cleanup completed successfully!');
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanSampleData();
