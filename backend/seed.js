require('dotenv').config();
const mongoose = require('mongoose');
const Car = require('./models/Car');
const Tyre = require('./models/Tyre');
const Admin = require('./models/Admin');
const Settings = require('./models/Settings');
const Driver = require('./models/Driver');

const cars = [
  {
    name: 'Ferrari 488 GTB',
    brand: 'Ferrari',
    model: '488 GTB',
    year: 2023,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 2,
    luggage: 1,
    mileage: '18,420 mi',
    horsepower: 6993,
    pricePerDay: 158,
    pricePerWeek: 950,
    pricePerMonth: 3500,
    vehicleType: 'Coupe',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Leather Seats', available: true },
      { name: 'Parking Sensors', available: true },
      { name: 'Cruise Control', available: true },
      { name: 'Sunroof', available: false },
      { name: 'Child Seat', available: false }
    ],
    images: ['/images/car-1.jpg'],
    rating: 4.9,
    reviewCount: 167,
    plateNumber: 'NYC-4521',
    status: 'available',
    description: 'The Ferrari 488 GTB is a mid-engine sports car produced by Italian automobile manufacturer Ferrari. Experience the thrill of Italian engineering with this powerful supercar.',
    distanceFromCenter: '425m',
    estimatedTime: '15min'
  },
  {
    name: 'Lamborghini Huracan',
    brand: 'Lamborghini',
    model: 'Huracan',
    year: 2023,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 2,
    luggage: 1,
    mileage: '12,500 mi',
    horsepower: 652,
    pricePerDay: 89.99,
    pricePerWeek: 550,
    pricePerMonth: 2200,
    vehicleType: 'Coupe',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Leather Seats', available: true },
      { name: 'Parking Sensors', available: true },
      { name: 'Cruise Control', available: true }
    ],
    images: ['/images/car-2.jpg'],
    rating: 5.0,
    reviewCount: 93,
    plateNumber: 'LA-8832',
    status: 'available',
    description: 'The Lamborghini Huracán is a sports car manufactured by Italian automotive manufacturer Lamborghini.',
    distanceFromCenter: '320m',
    estimatedTime: '10min'
  },
  {
    name: 'Land Rover Defender',
    brand: 'Land Rover',
    model: 'Defender',
    year: 2023,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 5,
    luggage: 4,
    mileage: '25,000 mi',
    horsepower: 652,
    pricePerDay: 58.75,
    pricePerWeek: 380,
    pricePerMonth: 1500,
    vehicleType: 'SUV',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Leather Seats', available: true },
      { name: '4x4 Drive', available: true },
      { name: 'Terrain Response', available: true },
      { name: 'Tow Bar', available: true }
    ],
    images: ['/images/car-3.jpg'],
    rating: 4.7,
    reviewCount: 133,
    plateNumber: 'SF-1203',
    status: 'available',
    description: 'The Land Rover Defender is a rugged and capable off-road vehicle perfect for adventure.',
    distanceFromCenter: '110m',
    estimatedTime: '9min'
  },
  {
    name: 'BMW X5',
    brand: 'BMW',
    model: 'X5',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    luggage: 3,
    mileage: '8,200 mi',
    horsepower: 652,
    pricePerDay: 52.25,
    pricePerWeek: 340,
    pricePerMonth: 1400,
    vehicleType: 'SUV',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Panoramic Sunroof', available: true },
      { name: 'Heated Seats', available: true },
      { name: 'Cruise Control', available: true }
    ],
    images: ['/images/car-4.jpg'],
    rating: 5.0,
    reviewCount: 134,
    plateNumber: 'NY-7721',
    status: 'available',
    description: 'The BMW X5 is a mid-size luxury SUV that combines elegance with performance.',
    distanceFromCenter: '493m',
    estimatedTime: '7min'
  },
  {
    name: 'Range Rover Evoque',
    brand: 'Land Rover',
    model: 'Range Rover Evoque',
    year: 2023,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 5,
    luggage: 3,
    mileage: '15,000 mi',
    horsepower: 652,
    pricePerDay: 48,
    pricePerWeek: 310,
    pricePerMonth: 1250,
    vehicleType: 'SUV',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Leather Seats', available: true },
      { name: 'Parking Camera', available: true }
    ],
    images: ['/images/car-5.jpg'],
    rating: 4.7,
    reviewCount: 167,
    plateNumber: 'CHI-9901',
    status: 'available',
    description: 'The Range Rover Evoque is a luxury compact SUV with striking design.',
    distanceFromCenter: '180m',
    estimatedTime: '5min'
  },
  {
    name: 'Porsche 718 Cayman',
    brand: 'Porsche',
    model: '718 Cayman',
    year: 2023,
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 2,
    luggage: 2,
    mileage: '5,300 mi',
    horsepower: 652,
    pricePerDay: 42.50,
    pricePerWeek: 280,
    pricePerMonth: 1100,
    vehicleType: 'Coupe',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Sport Mode', available: true },
      { name: 'Bose Sound System', available: true }
    ],
    images: ['/images/car-6.jpg'],
    rating: 4.5,
    reviewCount: 167,
    plateNumber: 'MI-3344',
    status: 'available',
    description: 'The Porsche 718 Cayman is a mid-engine sports car that delivers an exhilarating driving experience.',
    distanceFromCenter: '90m',
    estimatedTime: '2min'
  },
  {
    name: 'Mercedes-Benz S-Class',
    brand: 'Mercedes-Benz',
    model: 'S-Class',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 5,
    luggage: 4,
    mileage: '3,100 mi',
    horsepower: 496,
    pricePerDay: 120,
    pricePerWeek: 750,
    pricePerMonth: 3000,
    vehicleType: 'Sedan',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Massage Seats', available: true },
      { name: 'Ambient Lighting', available: true },
      { name: 'MBUX System', available: true }
    ],
    images: ['/images/car-7.jpg'],
    rating: 4.9,
    reviewCount: 210,
    plateNumber: 'BOS-5567',
    status: 'available',
    description: 'The Mercedes-Benz S-Class is the flagship luxury sedan that sets the standard for comfort and technology.'
  },
  {
    name: 'Audi Q7',
    brand: 'Audi',
    model: 'Q7',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seats: 7,
    luggage: 5,
    mileage: '6,800 mi',
    horsepower: 335,
    pricePerDay: 65,
    pricePerWeek: 420,
    pricePerMonth: 1700,
    vehicleType: 'SUV',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Third Row Seating', available: true },
      { name: 'Quattro AWD', available: true },
      { name: 'Virtual Cockpit', available: true }
    ],
    images: ['/images/car-8.jpg'],
    rating: 4.6,
    reviewCount: 88,
    plateNumber: 'DC-2233',
    status: 'unavailable',
    description: 'The Audi Q7 is a full-size luxury SUV with three rows and cutting-edge technology.'
  },
  {
    name: 'Tesla Model S',
    brand: 'Tesla',
    model: 'Model S',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Electric',
    seats: 5,
    luggage: 3,
    mileage: '2,100 mi',
    horsepower: 670,
    pricePerDay: 95,
    pricePerWeek: 600,
    pricePerMonth: 2400,
    vehicleType: 'Sedan',
    features: [
      { name: 'Autopilot', available: true },
      { name: 'Full Self-Driving', available: true },
      { name: 'Over-the-air Updates', available: true },
      { name: 'Glass Roof', available: true },
      { name: 'Premium Audio', available: true }
    ],
    images: ['/images/car-9.jpg'],
    rating: 4.8,
    reviewCount: 156,
    plateNumber: 'SEA-7788',
    status: 'rented',
    description: 'The Tesla Model S is an all-electric luxury sedan with impressive range and performance.'
  },
  {
    name: 'Toyota Camry',
    brand: 'Toyota',
    model: 'Camry',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Hybrid',
    seats: 5,
    luggage: 3,
    mileage: '1,500 mi',
    horsepower: 208,
    pricePerDay: 35,
    pricePerWeek: 220,
    pricePerMonth: 900,
    vehicleType: 'Sedan',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Apple CarPlay', available: true },
      { name: 'Safety Sense', available: true },
      { name: 'Cruise Control', available: true }
    ],
    images: ['/images/car-10.jpg'],
    rating: 4.4,
    reviewCount: 290,
    plateNumber: 'ATL-1122',
    status: 'available',
    description: 'The Toyota Camry Hybrid offers excellent fuel economy and reliability.'
  },
  {
    name: 'Ford Mustang GT',
    brand: 'Ford',
    model: 'Mustang GT',
    year: 2023,
    transmission: 'Manual',
    fuelType: 'Petrol',
    seats: 4,
    luggage: 2,
    mileage: '12,000 mi',
    horsepower: 450,
    pricePerDay: 75,
    pricePerWeek: 480,
    pricePerMonth: 1900,
    vehicleType: 'Coupe',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'Bluetooth', available: true },
      { name: 'Performance Pack', available: true },
      { name: 'Launch Control', available: true },
      { name: 'Recaro Seats', available: true }
    ],
    images: ['/images/car-11.jpg'],
    rating: 4.7,
    reviewCount: 178,
    plateNumber: 'HOU-3344',
    status: 'available',
    description: 'The Ford Mustang GT is an iconic American muscle car with thrilling V8 power.'
  },
  {
    name: 'Chevrolet Suburban',
    brand: 'Chevrolet',
    model: 'Suburban',
    year: 2024,
    transmission: 'Automatic',
    fuelType: 'Petrol',
    seats: 8,
    luggage: 6,
    mileage: '4,500 mi',
    horsepower: 355,
    pricePerDay: 55,
    pricePerWeek: 360,
    pricePerMonth: 1450,
    vehicleType: 'SUV',
    features: [
      { name: 'Air Conditioning', available: true },
      { name: 'GPS Navigation', available: true },
      { name: 'Third Row Seating', available: true },
      { name: 'Towing Package', available: true },
      { name: 'Rear Entertainment', available: true }
    ],
    images: ['/images/car-12.jpg'],
    rating: 4.5,
    reviewCount: 112,
    plateNumber: 'DAL-5566',
    status: 'available',
    description: 'The Chevrolet Suburban is a full-size SUV perfect for large families and group travel.'
  }
];

const tyres = [
  { sku: 'TYR-MICH-245', name: 'Pilot Sport 4S', brand: 'Michelin', model: 'Pilot Sport 4S', size: '245/40 R18', width: 245, aspectRatio: 40, rimDiameter: 18, loadIndex: '97', speedRating: 'Y', type: 'Performance', price: 189, stockQuantity: 18, lowStockThreshold: 4, inStock: true, rating: 4.8, vehicleType: 'Sedan', warranty: '2 Years', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Ultra-high performance summer tyre with exceptional grip and handling.' },
  { sku: 'TYR-BDG-255', name: 'Potenza Sport', brand: 'Bridgestone', model: 'Potenza Sport', size: '255/35 R19', width: 255, aspectRatio: 35, rimDiameter: 19, loadIndex: '96', speedRating: 'Y', type: 'Performance', price: 210, stockQuantity: 8, lowStockThreshold: 3, inStock: true, rating: 4.7, vehicleType: 'Coupe', warranty: '2 Years', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Premium sport tyre designed for maximum performance.' },
  { sku: 'TYR-GY-225', name: 'Eagle F1 Asymmetric 5', brand: 'Goodyear', model: 'Eagle F1', size: '225/45 R17', width: 225, aspectRatio: 45, rimDiameter: 17, loadIndex: '94', speedRating: 'W', type: 'Summer', price: 145, stockQuantity: 24, lowStockThreshold: 5, inStock: true, rating: 4.6, vehicleType: 'Sedan', warranty: '1 Year', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Premium summer tyre with excellent wet and dry performance.' },
  { sku: 'TYR-CONT-235', name: 'ContiSportContact 5', brand: 'Continental', model: 'SportContact 5', size: '235/40 R18', width: 235, aspectRatio: 40, rimDiameter: 18, loadIndex: '95', speedRating: 'Y', type: 'Summer', price: 165, stockQuantity: 12, lowStockThreshold: 4, inStock: true, rating: 4.5, vehicleType: 'Sedan', warranty: '2 Years', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Sports tyre with short braking distances.' },
  { sku: 'TYR-CONT-205', name: 'WinterContact TS 860', brand: 'Continental', model: 'WinterContact', size: '205/55 R16', width: 205, aspectRatio: 55, rimDiameter: 16, loadIndex: '91', speedRating: 'H', type: 'Winter', price: 132, stockQuantity: 3, lowStockThreshold: 4, inStock: true, rating: 4.4, vehicleType: 'Sedan', warranty: '1 Year', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Excellent winter tyre with superior snow grip.' },
  { sku: 'TYR-MICH-215', name: 'CrossClimate 2', brand: 'Michelin', model: 'CrossClimate 2', size: '215/55 R17', width: 215, aspectRatio: 55, rimDiameter: 17, loadIndex: '98', speedRating: 'V', type: 'All-Season', price: 175, stockQuantity: 14, lowStockThreshold: 4, inStock: true, rating: 4.9, vehicleType: 'SUV', warranty: '3 Years', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'All-season tyre that excels in all weather conditions.' },
  { sku: 'TYR-PIR-235', name: 'Scorpion Verde', brand: 'Pirelli', model: 'Scorpion Verde', size: '235/55 R19', width: 235, aspectRatio: 55, rimDiameter: 19, loadIndex: '101', speedRating: 'V', type: 'All-Season', price: 185, stockQuantity: 0, lowStockThreshold: 2, inStock: false, rating: 4.5, vehicleType: 'SUV', warranty: '2 Years', image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80', description: 'Eco-friendly SUV tyre with low rolling resistance.' }
];

const drivers = [
  {
    name: 'Marcus Vance',
    email: 'marcus.driver@carbook.com',
    phone: '+91 98765 11223',
    licenceNumber: 'DL-2022-789012',
    experienceYears: 6,
    supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury', 'Coupe'],
    isVerified: true,
    status: 'active',
    rating: 4.95,
    tripsCount: 42
  },
  {
    name: 'David Jenkins',
    email: 'david.driver@carbook.com',
    phone: '+91 98765 44556',
    licenceNumber: 'DL-2021-334455',
    experienceYears: 8,
    supportedVehicleTypes: ['Sedan', 'SUV', 'Luxury'],
    isVerified: true,
    status: 'active',
    rating: 4.88,
    tripsCount: 67
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Car.deleteMany({});
    await Tyre.deleteMany({});
    await Admin.deleteMany({});
    await Settings.deleteMany({});
    await Driver.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create default settings
    await Settings.getSettings();
    console.log('⚙️  Default business settings initialized');

    // Create admin user with role 'admin'
    const admin = new Admin({
      username: 'admin',
      email: 'Shajanshaji111@gmail.com',
      password: 'Password@123',
      name: 'A3 Car Rentals Admin',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    });
    await admin.save();
    console.log('👤 Admin created: admin (Shajanshaji111@gmail.com) / Password@123 [Role: admin]');

    // Seed cars
    await Car.insertMany(cars);
    console.log(`🚗 ${cars.length} cars seeded`);

    // Seed tyres
    await Tyre.insertMany(tyres);
    console.log(`🔧 ${tyres.length} tyres seeded`);

    // Seed drivers
    await Driver.insertMany(drivers);
    console.log(`👨‍✈️ ${drivers.length} drivers seeded`);

    console.log('\n✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
}

seed();
