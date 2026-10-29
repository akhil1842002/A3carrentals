require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Car = require('./models/Car');
const Tyre = require('./models/Tyre');
const Driver = require('./models/Driver');
const Booking = require('./models/Booking');
const TyreOrder = require('./models/TyreOrder');
const Review = require('./models/Review');

async function seedCustomerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Ensure Drivers exist
    let drivers = await Driver.find();
    if (drivers.length === 0) {
      drivers = await Driver.insertMany([
        {
          name: 'James Wilson',
          email: 'james.wilson@carbook.com',
          phone: '+1 (415) 890-1234',
          licenceNumber: 'DL-CA-98214',
          experienceYears: 6,
          supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury'],
          isVerified: true,
          status: 'active',
          rating: 4.9,
          tripsCount: 48
        },
        {
          name: 'Michael Chang',
          email: 'm.chang@carbook.com',
          phone: '+1 (415) 765-4321',
          licenceNumber: 'DL-CA-44512',
          experienceYears: 9,
          supportedVehicleTypes: ['Luxury', 'Coupe', 'Sedan'],
          isVerified: true,
          status: 'active',
          rating: 4.95,
          tripsCount: 72
        }
      ]);
      console.log('Seeded drivers');
    }

    // 2. Fetch cars and tyres
    const cars = await Car.find();
    const tyres = await Tyre.find();

    if (cars.length === 0 || tyres.length === 0) {
      console.log('Please ensure cars and tyres are seeded first');
      process.exit(1);
    }

    // 3. Ensure Akhil exists and has address
    let akhil = await User.findOne({ email: 'akhil1842002@gmail.com' });
    if (!akhil) {
      akhil = new User({
        name: 'Akhil R',
        email: 'akhil1842002@gmail.com',
        phone: '+91 91987 65789',
        password: 'password123',
        role: 'customer',
        status: 'active',
        addresses: []
      });
      await akhil.save();
    }

    // 4. Create other realistic registered customers if not already present
    const additionalCustomersData = [
      {
        name: 'Sophia Rodriguez',
        email: 'sophia.rodriguez@example.com',
        phone: '+1 (415) 555-0142',
        password: 'password123',
        role: 'customer',
        status: 'active',
        addresses: [{
          street: '742 Montgomery St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94111',
          country: 'USA',
          isDefault: true
        }]
      },
      {
        name: 'Marcus Vance',
        email: 'marcus.vance@techcorp.io',
        phone: '+1 (415) 555-0198',
        password: 'password123',
        role: 'customer',
        status: 'active',
        addresses: [{
          street: '1200 Market Street #4B',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'USA',
          isDefault: true
        }]
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@designworks.com',
        phone: '+1 (650) 555-0187',
        password: 'password123',
        role: 'customer',
        status: 'active',
        addresses: [{
          street: '350 University Ave',
          city: 'Palo Alto',
          state: 'CA',
          zip: '94301',
          country: 'USA',
          isDefault: true
        }]
      }
    ];

    const customerUsers = [akhil];
    for (const cData of additionalCustomersData) {
      let existing = await User.findOne({ email: cData.email });
      if (!existing) {
        existing = new User(cData);
        await existing.save();
      }
      customerUsers.push(existing);
    }
    console.log(`Registered customers active: ${customerUsers.length}`);

    // Clean old bookings, orders, and reviews if needed or seed if empty
    const existingBookings = await Booking.countDocuments();
    if (existingBookings === 0) {
      console.log('Seeding rich bookings...');
      const sampleBookings = [
        {
          bookingReference: 'BK-FERRARI-01',
          user: akhil._id,
          car: cars[0]._id, // Ferrari 488 GTB
          rentalType: 'self_drive',
          withDriver: false,
          pickupDate: new Date('2026-10-15T09:00:00Z'),
          dropoffDate: new Date('2026-10-18T18:00:00Z'),
          pickupLocation: 'SFO International Airport, Hub Terminal 2',
          dropoffLocation: 'SFO International Airport, Hub Terminal 2',
          days: 3,
          dailyRate: cars[0].pricePerDay,
          subtotal: cars[0].pricePerDay * 3,
          driverFee: 0,
          taxAmount: Math.round(cars[0].pricePerDay * 3 * 0.08),
          securityDeposit: 250,
          totalPrice: (cars[0].pricePerDay * 3) + Math.round(cars[0].pricePerDay * 3 * 0.08),
          status: 'completed',
          paymentStatus: 'fully_paid',
          paymentMethod: 'card',
          notes: 'Customer requested GPS unit and premium interior cleanup.',
          inspection: {
            pickupOdometer: 18420,
            pickupFuelLevel: 'Full (100%)',
            pickupNotes: 'Exterior flawless, tyres at 95% tread depth.',
            returnOdometer: 18740,
            returnFuelLevel: 'Full (100%)',
            returnNotes: 'Vehicle returned in perfect condition, no scratches.',
            extraCharges: 0,
            inspectedBy: 'Chief Inspector David'
          }
        },
        {
          bookingReference: 'BK-DEFEND-02',
          user: akhil._id,
          car: cars[2]._id, // Land Rover Defender
          rentalType: 'with_driver',
          withDriver: true,
          driver: drivers[0]._id,
          driverStatus: 'completed',
          pickupDate: new Date('2026-10-22T08:00:00Z'),
          dropoffDate: new Date('2026-10-24T20:00:00Z'),
          pickupLocation: 'Downtown San Francisco Hotel',
          dropoffLocation: 'SFO International Airport',
          days: 2,
          dailyRate: cars[2].pricePerDay,
          subtotal: cars[2].pricePerDay * 2,
          driverFee: 70,
          taxAmount: Math.round((cars[2].pricePerDay * 2 + 70) * 0.08),
          securityDeposit: 150,
          totalPrice: (cars[2].pricePerDay * 2 + 70) + Math.round((cars[2].pricePerDay * 2 + 70) * 0.08),
          status: 'completed',
          paymentStatus: 'fully_paid',
          paymentMethod: 'card',
          notes: 'Chauffeur trip to Lake Tahoe weekend retreat.',
          inspection: {
            pickupOdometer: 25000,
            pickupFuelLevel: 'Full (100%)',
            pickupNotes: 'All-terrain tyres inspected, cabin spotless.',
            returnOdometer: 25480,
            returnFuelLevel: 'Full (100%)',
            returnNotes: 'Clean return, driver reported smooth trip.',
            extraCharges: 0,
            inspectedBy: 'Station Supervisor Mark'
          }
        },
        {
          bookingReference: 'BK-LAMBO-03',
          user: customerUsers[1]._id, // Sophia Rodriguez
          car: cars[1]._id, // Lamborghini Huracan
          rentalType: 'self_drive',
          withDriver: false,
          pickupDate: new Date('2026-10-26T10:00:00Z'),
          dropoffDate: new Date('2026-10-28T18:00:00Z'),
          pickupLocation: 'SFO International Airport',
          dropoffLocation: 'SFO International Airport',
          days: 2,
          dailyRate: cars[1].pricePerDay,
          subtotal: cars[1].pricePerDay * 2,
          driverFee: 0,
          taxAmount: Math.round(cars[1].pricePerDay * 2 * 0.08),
          securityDeposit: 300,
          totalPrice: (cars[1].pricePerDay * 2) + Math.round(cars[1].pricePerDay * 2 * 0.08),
          status: 'confirmed',
          paymentStatus: 'deposit_paid',
          paymentMethod: 'card',
          notes: 'VIP client pickup for corporate anniversary gala.'
        },
        {
          bookingReference: 'BK-MERC-04',
          user: customerUsers[2]._id, // Marcus Vance
          car: cars[6]._id || cars[0]._id, // Mercedes S-Class
          rentalType: 'with_driver',
          withDriver: true,
          driver: drivers[1]._id,
          driverStatus: 'assigned',
          pickupDate: new Date('2026-10-24T14:00:00Z'),
          dropoffDate: new Date('2026-10-25T18:00:00Z'),
          pickupLocation: 'Silicon Valley Tech Summit, San Jose',
          dropoffLocation: 'SFO International Airport',
          days: 1,
          dailyRate: cars[6]?.pricePerDay || 120,
          subtotal: (cars[6]?.pricePerDay || 120),
          driverFee: 35,
          taxAmount: Math.round(((cars[6]?.pricePerDay || 120) + 35) * 0.08),
          securityDeposit: 200,
          totalPrice: (cars[6]?.pricePerDay || 120) + 35 + Math.round(((cars[6]?.pricePerDay || 120) + 35) * 0.08),
          status: 'ongoing',
          paymentStatus: 'fully_paid',
          paymentMethod: 'card',
          notes: 'Executive chauffeur service requested.'
        }
      ];

      await Booking.insertMany(sampleBookings);
      console.log('Seeded sample bookings');
    }

    // 5. Seed Tyre Orders if empty
    const existingOrders = await TyreOrder.countDocuments();
    if (existingOrders === 0) {
      console.log('Seeding rich tyre orders...');
      const sampleOrders = [
        {
          orderNumber: 'ORD-982145',
          user: akhil._id,
          items: [
            {
              tyre: tyres[0]._id, // Michelin Pilot Sport 4S
              name: tyres[0].name,
              brand: tyres[0].brand,
              size: tyres[0].size,
              sku: 'TYR-MICH-01',
              unitPrice: tyres[0].price,
              quantity: 2,
              image: tyres[0].image
            }
          ],
          subtotal: tyres[0].price * 2,
          shippingFee: 0,
          taxAmount: Math.round(tyres[0].price * 2 * 0.08),
          totalAmount: (tyres[0].price * 2) + Math.round(tyres[0].price * 2 * 0.08),
          deliveryAddress: {
            fullName: 'Akhil R',
            phone: '+91 91987 65789',
            street: '450 Mission Bay Blvd S',
            city: 'San Francisco',
            state: 'CA',
            zip: '94158'
          },
          deliveryMethod: 'shipping',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          status: 'delivered',
          trackingNumber: 'TRK-983214589',
          carrier: 'FedEx Express'
        },
        {
          orderNumber: 'ORD-541289',
          user: akhil._id,
          items: [
            {
              tyre: tyres[1]._id, // Bridgestone Potenza
              name: tyres[1].name,
              brand: tyres[1].brand,
              size: tyres[1].size,
              sku: 'TYR-BRDG-02',
              unitPrice: tyres[1].price,
              quantity: 4,
              image: tyres[1].image
            }
          ],
          subtotal: tyres[1].price * 4,
          shippingFee: 0,
          taxAmount: Math.round(tyres[1].price * 4 * 0.08),
          totalAmount: (tyres[1].price * 4) + Math.round(tyres[1].price * 4 * 0.08),
          deliveryAddress: {
            fullName: 'Akhil R',
            phone: '+91 91987 65789',
            street: '450 Mission Bay Blvd S',
            city: 'San Francisco',
            state: 'CA',
            zip: '94158'
          },
          deliveryMethod: 'workshop_pickup',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          status: 'processing',
          trackingNumber: 'TRK-22441199',
          carrier: 'Local Workshop Hub'
        },
        {
          orderNumber: 'ORD-771239',
          user: customerUsers[1]._id, // Sophia Rodriguez
          items: [
            {
              tyre: tyres[2]._id, // Goodyear Eagle F1
              name: tyres[2].name,
              brand: tyres[2].brand,
              size: tyres[2].size,
              sku: 'TYR-GDYR-03',
              unitPrice: tyres[2].price,
              quantity: 2,
              image: tyres[2].image
            }
          ],
          subtotal: tyres[2].price * 2,
          shippingFee: 15,
          taxAmount: Math.round(tyres[2].price * 2 * 0.08),
          totalAmount: (tyres[2].price * 2) + 15 + Math.round(tyres[2].price * 2 * 0.08),
          deliveryAddress: {
            fullName: 'Sophia Rodriguez',
            phone: '+1 (415) 555-0142',
            street: '742 Montgomery St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94111'
          },
          deliveryMethod: 'shipping',
          paymentMethod: 'card',
          paymentStatus: 'paid',
          status: 'shipped',
          trackingNumber: 'TRK-55441122',
          carrier: 'UPS Ground'
        }
      ];

      await TyreOrder.insertMany(sampleOrders);
      console.log('Seeded sample tyre orders');
    }

    // 6. Seed Reviews if empty
    const existingReviews = await Review.countDocuments();
    if (existingReviews === 0) {
      console.log('Seeding customer reviews...');
      const sampleReviews = [
        {
          user: akhil._id,
          targetType: 'car',
          car: cars[0]._id, // Ferrari 488 GTB
          rating: 5,
          title: 'Unbelievable performance & immaculate condition!',
          comment: 'Rented the Ferrari 488 GTB for 3 days. The vehicle arrived spotless and the acceleration is mind-blowing. Handover at SFO Airport was effortless. Will definitely book again!',
          verifiedPurchase: true
        },
        {
          user: akhil._id,
          targetType: 'tyre',
          tyre: tyres[0]._id, // Michelin Pilot Sport 4S
          rating: 5,
          title: 'Best grip in wet and dry conditions',
          comment: 'Bought a set of Michelin Pilot Sport 4S tyres from CarBook. Prompt FedEx delivery within 48 hours. Cornering grip and highway ride comfort are top tier.',
          verifiedPurchase: true
        },
        {
          user: akhil._id,
          targetType: 'car',
          car: cars[2]._id, // Land Rover Defender
          rating: 5,
          title: 'Superb chauffeur trip to Tahoe',
          comment: 'The Defender handled snowy elevation with absolute ease. Our driver James was extremely courteous, punctual, and drove very smoothly. 10/10 service.',
          verifiedPurchase: true
        },
        {
          user: customerUsers[1]._id, // Sophia Rodriguez
          targetType: 'car',
          car: cars[1]._id, // Lamborghini Huracan
          rating: 5,
          title: 'Exotic supercar perfection',
          comment: 'The Huracan sounds like thunder. Booking process was clear, security deposit terms transparent, and the customer support team was very responsive.',
          verifiedPurchase: true
        },
        {
          user: customerUsers[1]._id,
          targetType: 'tyre',
          tyre: tyres[2]._id, // Goodyear Eagle F1
          rating: 4,
          title: 'Solid daily performance tyre',
          comment: 'Good response on highway commutes and low road noise. Packaging was sturdy and dispatch was quick.',
          verifiedPurchase: true
        }
      ];

      await Review.insertMany(sampleReviews);
      console.log('Seeded sample customer reviews');
    }

    console.log('All customer history, tyre purchases, and reviews seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedCustomerData();
