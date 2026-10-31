const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  businessName: { type: String, default: 'CarBook Mobility India' },
  tagline: { type: String, default: 'Premium Car Rentals & Chauffeur Services' },
  currency: { type: String, default: 'INR' },
  currencySymbol: { type: String, default: '₹' },
  taxRatePercent: { type: Number, default: 18.0 }, // GST in India
  driverDailyFee: { type: Number, default: 999.0 },
  defaultSecurityDeposit: { type: Number, default: 0 },
  standardShippingFee: { type: Number, default: 350.0 },
  freeShippingThreshold: { type: Number, default: 5000.0 },
  allowReservePayOnPickup: { type: Boolean, default: true },
  supportEmail: { type: String, default: 'Shajanshaji111@gmail.com' },
  supportPhone: { type: String, default: '+91 96291 82095' },
  whatsappNumber: { type: String, default: '919629182095' },
  operatingHours: { type: String, default: 'Mon - Sun: 8:00 AM - 10:00 PM' },
  hubAddress: { type: String, default: 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153' },
  googleMapsEmbedUrl: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15791.058512382906!2d77.15638885576467!3d8.326171267354821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05ab2e7848b5e1%3A0xbe02000328d9065!2sA3%20Car%20rental!5e0!3m2!1sen!2sin!4v1793281171962!5m2!1sen!2sin' },

  // Social Media Channels
  socialLinks: {
    instagram: { type: String, default: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5' },
    facebook: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' }
  },
  instagramUrl: { type: String, default: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5' },
  facebookUrl: { type: String, default: '' },
  twitterUrl: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },

  // Fleet Master Setup (Brands, Vehicle Types, Fuel Types, Features)
  fleetMaster: {
    brands: {
      type: [String],
      default: [
        'Toyota', 'Mahindra', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Honda',
        'Kia', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen',
        'Skoda', 'Renault', 'Nissan'
      ]
    },
    vehicleTypes: {
      type: [String],
      default: [
        'Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury', 'Van', 'Coupe', 'Convertible'
      ]
    },
    fuelTypes: {
      type: [String],
      default: [
        'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'
      ]
    },
    features: {
      type: [String],
      default: [
        'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'Leather Seats',
        'Parking Sensors', 'Cruise Control', 'Reverse Camera', 'Sunroof',
        'Apple CarPlay / Android Auto', 'USB Fast Charger'
      ]
    }
  },
  
  // Custom Announcement / Event Offer Poster Banner
  eventOffer: {
    enabled: { type: Boolean, default: true },
    badge: { type: String, default: 'FESTIVE OFFER • LIMITED TIME' },
    title: { type: String, default: 'Festive Season Special: Flat 20% OFF on Luxury SUVs & Sedans!' },
    description: { type: String, default: 'Book any self-drive or chauffeured vehicle across India for 2+ days. Instant WhatsApp confirmation & zero hidden deposit deductions.' },
    promoCode: { type: String, default: 'FESTIVE20' },
    discountText: { type: String, default: 'FLAT 20% OFF' },
    bannerImage: { type: String, default: '/images/bg_1.jpg' },
    buttonText: { type: String, default: 'Claim Offer & Book Now' },
    buttonLink: { type: String, default: '/dashboard?tab=cars' }
  },

  landingPage: {
    heroTitle: { type: String, default: 'Fast & Easy Way To Rent A Car in India' },
    heroSubtitle: { type: String, default: 'Explore our curated fleet of luxury sedans, rugged SUVs, and high-performance supercars. Sign up or log in to browse, reserve, and manage your vehicle rentals seamlessly.' },
    heroBgImage: { type: String, default: '/images/bg_1.jpg' },
    heroCtaText: { type: String, default: 'Get Started' },

    howItWorksTitle: { type: String, default: 'Book Your Car in 3 Steps' },
    howItWorksSubtitle: { type: String, default: 'Simple, fast, and hassle-free car rental experience' },
    step1Title: { type: String, default: 'Create Account' },
    step1Desc: { type: String, default: 'Sign up for free and get instant access to our premium fleet of vehicles.' },
    step2Title: { type: String, default: 'Choose Your Car' },
    step2Desc: { type: String, default: 'Browse available cars with real-time status. Pick the one that suits your needs.' },
    step3Title: { type: String, default: 'Book & Drive' },
    step3Desc: { type: String, default: 'Select your dates, confirm the booking, and hit the road. It\'s that simple!' },

    aboutBadgeYears: { type: String, default: '10+' },
    aboutBadgeText: { type: String, default: 'Years of Excellence' },
    aboutTitle: { type: String, default: 'Your Premium Mobility Partner' },
    aboutDesc: { type: String, default: 'We provide premium car rentals for all your driving requirements. Whether you need a sleek sports car for the weekend, a rugged SUV for an expedition, or a comfortable sedan for your daily commute — CarBook has you covered.' },
    aboutFeature1: { type: String, default: '24/7 dedicated customer assistance & roadside support' },
    aboutFeature2: { type: String, default: 'Over 50+ premium vehicles across sports, luxury, and SUV categories' },
    aboutFeature3: { type: String, default: 'Easy online booking with real-time availability' },
    aboutFeature4: { type: String, default: 'Transparent pricing with no hidden charges' },
    aboutImage: { type: String, default: '/images/about.jpg' },

    // Company Location & Interactive Map Pin
    companyLocation: { type: String, default: 'Near by Jayamatha Hospital, Opp. Ration Shop, Kaliakkavillai, Panamkalai - 629153' },
    companyMapQuery: { type: String, default: 'A3 Car rental Kaliakkavillai panamkalai 629153' },
    companyMapEmbedUrl: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15791.058512382906!2d77.15638885576467!3d8.326171267354821!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b05ab2e7848b5e1%3A0xbe02000328d9065!2sA3%20Car%20rental!5e0!3m2!1sen!2sin!4v1793281171962!5m2!1sen!2sin' },
    companyLocationNotes: { type: String, default: 'Near by Jayamatha Hospital, Landmark: Opposite Ration Shop' },

    // Social Media Links in Landing Page
    instagramUrl: { type: String, default: 'https://www.instagram.com/cabs_and_tyres?obrf=aHU4cnNnejljcGM5' },
    facebookUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },

    servicesTitle: { type: String, default: 'What We Offer' },
    servicesSubtitle: { type: String, default: 'Tailored automotive services to cater to every occasion' },

    stat1Number: { type: String, default: '56+' },
    stat1Label: { type: String, default: 'Available Vehicles' },
    stat2Number: { type: String, default: '2,400+' },
    stat2Label: { type: String, default: 'Happy Customers' },
    stat3Number: { type: String, default: '100%' },
    stat3Label: { type: String, default: 'Satisfaction Rate' },
    stat4Number: { type: String, default: '24/7' },
    stat4Label: { type: String, default: 'Customer Support' },

    reviewsTitle: { type: String, default: 'What Our Renters Say' },
    reviewsSubtitle: { type: String, default: 'Authentic reviews and driving impressions from verified customers' },

    // Rent Car with Professional Acting Driver Section
    actingDriverEnabled: { type: Boolean, default: true },
    actingDriverBadge: { type: String, default: 'RENT WITH VERIFIED DRIVER' },
    actingDriverTitle: { type: String, default: 'Rent Any Car with a Professional Acting Driver' },
    actingDriverSubtitle: { type: String, default: 'Sit back, relax, and let our verified professional drivers take the wheel. Choose any sedan, SUV, or luxury car from our fleet with a dedicated chauffeur for local errands, weddings, outstation highway trips, or airport transfers.' },
    actingDriverRate: { type: String, default: 'Car Rental + Affordable Driver Daily Fee' },
    actingDriverFeature1: { type: String, default: 'All Fleet Cars Available with Driver' },
    actingDriverFeature2: { type: String, default: 'Local City & Long Distance Outstation' },
    actingDriverFeature3: { type: String, default: 'Police Verified, Polite & Experienced' },
    actingDriverFeature4: { type: String, default: 'Zero Driving Fatigue & Complete Safety' },
    actingDriverCtaText: { type: String, default: 'Book Car with Driver on WhatsApp' },

    // FAQs Section (Admin manageable)
    faqsTitle: { type: String, default: 'Frequently Asked Questions' },
    faqsSubtitle: { type: String, default: 'Everything you need to know about renting a car and booking with a professional acting driver' },
    faqs: {
      type: Array,
      default: [
        {
          id: 'faq-1',
          question: 'Can I rent a car and also get an acting driver for that rented car?',
          answer: 'Yes, absolutely! You can choose either Self-Drive or book any car from our fleet with a verified, experienced acting driver. Our driver will handle traffic, navigation, and parking so you can travel in total comfort.'
        },
        {
          id: 'faq-2',
          question: 'What are the charges for renting a car with an acting driver?',
          answer: 'The car rental rate is based on the selected vehicle, and the professional driver charge is a transparent daily fee (typically ₹800–₹999/day or nominal trip fee) with zero hidden deductions.'
        },
        {
          id: 'faq-3',
          question: 'What documents are required to rent a self-drive car?',
          answer: 'For self-drive rentals, you need a valid Original Driving Licence (min 1 year old) and an Aadhaar card / Government Photo ID. If booking with our acting driver, only basic ID proof is required.'
        },
        {
          id: 'faq-4',
          question: 'Where can I pick up the car or meet the driver?',
          answer: 'You can pick up vehicles directly from our main hub at Kaliakkavillai (near Jayamatha Hospital, opposite Ration Shop) or request doorstep delivery across Marthandam, Nagercoil, and Trivandrum.'
        },
        {
          id: 'faq-5',
          question: 'Are your vehicles permitted for outstation and interstate travel?',
          answer: 'Yes! All vehicles have valid commercial tourist permits, comprehensive insurance, and interstate authorization for smooth travel across Tamil Nadu, Kerala, and all of South India.'
        }
      ]
    },

    // Popular Cars / Featured Fleet Section
    popularCarsSubheading: { type: String, default: 'OUR FEATURED FLEET' },
    popularCarsTitle: { type: String, default: 'Available Rental Vehicles' },
    popularCarsSubtitle: { type: String, default: 'Verified, fully-insured fleet available for Self-Drive or with our Professional Acting Driver. Create an account to reserve instantly.' },

    // Why Choose Us Section
    whyChooseSubheading: { type: String, default: 'OUR COMMITMENT' },
    whyChooseTitle: { type: String, default: 'Why Choose A3 Car rental?' },
    whyChooseSubtitle: { type: String, default: 'Top-rated car rental and acting driver service across Kaliakkavillai, Kanyakumari, and Trivandrum.' },
    whyFeature1Title: { type: String, default: 'Car + Professional Acting Driver' },
    whyFeature1Desc: { type: String, default: 'Need someone else to drive? You can rent any car from our fleet with an experienced, polite, police-verified acting driver for local trips, weddings, or long highway journeys.' },
    whyFeature2Title: { type: String, default: 'Transparent Pricing & No Hidden Fees' },
    whyFeature2Desc: { type: String, default: 'Clear daily rental prices, transparent fuel terms, and zero unexpected security deposit deductions. What you see is what you pay.' },
    whyFeature3Title: { type: String, default: 'Local Hub & Doorstep Delivery' },
    whyFeature3Desc: { type: String, default: 'Convenient pickup right opposite the Ration shop near Jayamatha Hospital, Kaliakkavillai, or doorstep handover at your home, hotel, or airport.' },
    whyFeature4Title: { type: String, default: 'Clean, Sanitized & Maintained Fleet' },
    whyFeature4Desc: { type: String, default: 'Every vehicle is thoroughly vacuumed, washed, safety-checked, and highway-tested prior to handover for worry-free driving.' },
    whyFeature5Title: { type: String, default: '24/7 Support & Roadside Help' },
    whyFeature5Desc: { type: String, default: 'Round-the-clock emergency assistance, tyre support, and phone concierge available across Tamil Nadu and Kerala.' },
    whyFeature6Title: { type: String, default: 'Instant Online Booking' },
    whyFeature6Desc: { type: String, default: 'Sign up in minutes to access our verified fleet, book self-drive or acting driver rides, and track reservations in real-time.' },

    // Vehicle Categories Section
    categoriesSubheading: { type: String, default: 'BROWSE BY FLEET TYPE' },
    categoriesTitle: { type: String, default: 'Vehicle Categories' },
    categoriesSubtitle: { type: String, default: 'From compact city cars to spacious family MUVs and wedding luxury sedans — available with or without driver.' },
    cat1Badge: { type: String, default: '7-9 Seater Fleet' },
    cat1Title: { type: String, default: 'SUVs & Family MUVs' },
    cat1Desc: { type: String, default: 'Toyota Innova Crysta, Fortuner, Thar & Scorpio. Ideal for outstation family trips and hill stations.' },
    cat2Badge: { type: String, default: '5 Seater Comfort' },
    cat2Title: { type: String, default: 'Sedans & Compacts' },
    cat2Desc: { type: String, default: 'Swift Dzire, Honda City & Hyundai Verna. Smooth highway cruising with generous boot space.' },
    cat3Badge: { type: String, default: 'VIP & Ceremony' },
    cat3Title: { type: String, default: 'Luxury & Wedding Fleet' },
    cat3Desc: { type: String, default: 'Mercedes-Benz, BMW & Audi with uniformed professional chauffeurs for grand wedding entrances.' },
    cat4Badge: { type: String, default: '⭐ Chauffeur Included' },
    cat4Title: { type: String, default: 'Any Car + Acting Driver' },
    cat4Desc: { type: String, default: 'Book any car with our experienced acting driver for stress-free travel, night driving, or outstation tours.' },

    // Hub & Delivery Coverage
    mainHubAddress: { type: String, default: 'Opp. Ration Shop, Near Jayamatha Hospital, Kaliakkavillai, Panamkalai - 629153' },
    deliveryCoverage: { type: String, default: 'Marthandam • Nagercoil • Kanyakumari • Trivandrum (TRV) Airport • Kuzhithurai' },

    heroBadge: { type: String, default: '🚗 Self-Drive & Chauffeur Car Rentals' },
    ctaBadge: { type: String, default: 'READY TO HIT THE ROAD?' },
    ctaButtonText: { type: String, default: 'Sign Up Now to Book' },
    ctaTitle: { type: String, default: 'Ready to Hit the Road?' },
    ctaDesc: { type: String, default: 'Create your account now and start exploring our premium fleet. Book your dream car in minutes!' },
    ctaBgImage: { type: String, default: '/images/bg_3.jpg' }
  }
}, { timestamps: true, strict: false });

// Ensure only one settings document exists (singleton pattern)
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
