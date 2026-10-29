const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');

// GET /api/settings - Public settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings - Admin update settings
router.put('/', adminAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const allowedFields = [
      'businessName', 'tagline', 'currency', 'currencySymbol',
      'taxRatePercent', 'driverDailyFee', 'defaultSecurityDeposit',
      'standardShippingFee', 'freeShippingThreshold',
      'allowReservePayOnPickup', 'supportEmail', 'supportPhone',
      'whatsappNumber', 'operatingHours', 'hubAddress', 'googleMapsEmbedUrl',
      'socialLinks', 'instagramUrl', 'facebookUrl', 'twitterUrl', 'youtubeUrl',
      'landingPage', 'eventOffer'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'whatsappNumber') {
          let cleaned = String(req.body[field]).replace(/\D/g, '');
          // If 10 digits without country code, default to 91 (India) prefix
          if (cleaned.length === 10) cleaned = '91' + cleaned;
          settings[field] = cleaned;
        } else if (field === 'landingPage' && typeof req.body.landingPage === 'object') {
          settings.landingPage = {
            ...(settings.landingPage ? settings.landingPage.toObject() : {}),
            ...req.body.landingPage
          };
          settings.markModified('landingPage');
        } else if (field === 'eventOffer' && typeof req.body.eventOffer === 'object') {
          settings.eventOffer = {
            ...(settings.eventOffer ? settings.eventOffer.toObject() : {}),
            ...req.body.eventOffer
          };
          settings.markModified('eventOffer');
        } else {
          settings[field] = req.body[field];
        }
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings/event-offer - Dedicated Admin update for Event Offer Poster Banner
router.put('/event-offer', adminAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (req.body && typeof req.body === 'object') {
      const existing = settings.eventOffer ? (settings.eventOffer.toObject ? settings.eventOffer.toObject() : settings.eventOffer) : {};
      const bannerImage = req.body.bannerImage || existing.bannerImage || '/images/bg_2.jpg';
      settings.eventOffer = {
        ...existing,
        ...req.body,
        bannerImage
      };
      settings.markModified('eventOffer');
      await settings.save();
    }
    res.json(settings.eventOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings/landing-page - Dedicated Admin update for landing page contents
router.put('/landing-page', adminAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (req.body && typeof req.body === 'object') {
      const existing = settings.landingPage ? (settings.landingPage.toObject ? settings.landingPage.toObject() : settings.landingPage) : {};
      const heroBgImage = req.body.heroBgImage || existing.heroBgImage || '/images/bg_1.jpg';
      const aboutImage = req.body.aboutImage || existing.aboutImage || '/images/about.jpg';
      const ctaBgImage = req.body.ctaBgImage || existing.ctaBgImage || '/images/bg_3.jpg';

      settings.landingPage = {
        ...existing,
        ...req.body,
        heroBgImage,
        aboutImage,
        ctaBgImage
      };
      if (req.body.companyLocation) {
        settings.hubAddress = req.body.companyLocation;
      }
      if (req.body.instagramUrl !== undefined) {
        settings.instagramUrl = req.body.instagramUrl;
        if (!settings.socialLinks) settings.socialLinks = {};
        settings.socialLinks.instagram = req.body.instagramUrl;
      }
      if (req.body.facebookUrl !== undefined) {
        settings.facebookUrl = req.body.facebookUrl;
        if (!settings.socialLinks) settings.socialLinks = {};
        settings.socialLinks.facebook = req.body.facebookUrl;
      }
      if (req.body.twitterUrl !== undefined) {
        settings.twitterUrl = req.body.twitterUrl;
        if (!settings.socialLinks) settings.socialLinks = {};
        settings.socialLinks.twitter = req.body.twitterUrl;
      }
      settings.markModified('landingPage');
      settings.markModified('socialLinks');
      await settings.save();
    }
    res.json(settings.landingPage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const DEFAULT_FLEET_MASTER = {
  brands: [
    'Toyota', 'Mahindra', 'Hyundai', 'Maruti Suzuki', 'Tata', 'Honda',
    'Kia', 'Ford', 'BMW', 'Mercedes-Benz', 'Audi', 'Tesla', 'Volkswagen',
    'Skoda', 'Renault', 'Nissan'
  ],
  vehicleTypes: [
    'Sedan', 'SUV', 'MUV', 'Hatchback', 'Luxury', 'Van', 'Coupe', 'Convertible'
  ],
  fuelTypes: [
    'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'
  ],
  features: [
    'Air Conditioning', 'GPS Navigation', 'Bluetooth', 'Leather Seats',
    'Parking Sensors', 'Cruise Control', 'Reverse Camera', 'Sunroof',
    'Apple CarPlay / Android Auto', 'USB Fast Charger'
  ]
};

// GET /api/settings/fleet-master - Retrieve all master setup attributes
router.get('/fleet-master', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const fm = settings.fleetMaster || {};
    
    const responseMaster = {
      brands: Array.isArray(fm.brands) && fm.brands.length > 0 ? fm.brands : DEFAULT_FLEET_MASTER.brands,
      vehicleTypes: Array.isArray(fm.vehicleTypes) && fm.vehicleTypes.length > 0 ? fm.vehicleTypes : DEFAULT_FLEET_MASTER.vehicleTypes,
      fuelTypes: Array.isArray(fm.fuelTypes) && fm.fuelTypes.length > 0 ? fm.fuelTypes : DEFAULT_FLEET_MASTER.fuelTypes,
      features: Array.isArray(fm.features) && fm.features.length > 0 ? fm.features : DEFAULT_FLEET_MASTER.features
    };
    
    if (!settings.fleetMaster || !Array.isArray(settings.fleetMaster.brands) || settings.fleetMaster.brands.length === 0) {
      settings.fleetMaster = responseMaster;
      settings.markModified('fleetMaster');
      await settings.save();
    }
    
    res.json(responseMaster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings/fleet-master - Save full fleet master configuration
router.put('/fleet-master', adminAuth, async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const { brands, vehicleTypes, fuelTypes, features } = req.body || {};
    const existing = settings.fleetMaster ? (settings.fleetMaster.toObject ? settings.fleetMaster.toObject() : settings.fleetMaster) : {};
    
    settings.fleetMaster = {
      brands: Array.isArray(brands) ? brands.map(s => String(s).trim()).filter(Boolean) : (existing.brands || DEFAULT_FLEET_MASTER.brands),
      vehicleTypes: Array.isArray(vehicleTypes) ? vehicleTypes.map(s => String(s).trim()).filter(Boolean) : (existing.vehicleTypes || DEFAULT_FLEET_MASTER.vehicleTypes),
      fuelTypes: Array.isArray(fuelTypes) ? fuelTypes.map(s => String(s).trim()).filter(Boolean) : (existing.fuelTypes || DEFAULT_FLEET_MASTER.fuelTypes),
      features: Array.isArray(features) ? features.map(s => String(s).trim()).filter(Boolean) : (existing.features || DEFAULT_FLEET_MASTER.features)
    };
    
    settings.markModified('fleetMaster');
    await settings.save();
    res.json(settings.fleetMaster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/settings/fleet-master/:category - Quick add a new item from Master Page or CarModal (+) button
router.post('/fleet-master/:category', adminAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['brands', 'vehicleTypes', 'fuelTypes', 'features'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }

    const name = (req.body.name || req.body.item || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Name/value is required' });
    }

    const settings = await Settings.getSettings();
    if (!settings.fleetMaster) {
      settings.fleetMaster = { ...DEFAULT_FLEET_MASTER };
    }

    const currentList = Array.isArray(settings.fleetMaster[category]) && settings.fleetMaster[category].length > 0
      ? settings.fleetMaster[category]
      : (DEFAULT_FLEET_MASTER[category] || []);

    const exists = currentList.some(item => item.toLowerCase() === name.toLowerCase());
    if (!exists) {
      settings.fleetMaster[category] = [...currentList, name];
      settings.markModified('fleetMaster');
      await settings.save();
    }

    res.json({
      success: true,
      category,
      addedItem: name,
      items: settings.fleetMaster[category]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/settings/fleet-master/:category/edit - Rename/edit an item in a category
router.put('/fleet-master/:category/edit', adminAuth, async (req, res) => {
  try {
    const { category } = req.params;
    const { oldName, newName } = req.body;
    if (!oldName || !newName || !newName.trim()) {
      return res.status(400).json({ message: 'Both oldName and newName are required' });
    }

    const settings = await Settings.getSettings();
    if (!settings.fleetMaster || !Array.isArray(settings.fleetMaster[category])) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const cleanNew = newName.trim();
    settings.fleetMaster[category] = settings.fleetMaster[category].map(item =>
      item.toLowerCase() === oldName.trim().toLowerCase() ? cleanNew : item
    );
    settings.markModified('fleetMaster');
    await settings.save();

    res.json({ success: true, items: settings.fleetMaster[category] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/settings/fleet-master/:category/:item - Delete an item from a category
router.delete('/fleet-master/:category/:item', adminAuth, async (req, res) => {
  try {
    const { category, item } = req.params;
    const decodedItem = decodeURIComponent(item).trim();

    const settings = await Settings.getSettings();
    if (!settings.fleetMaster || !Array.isArray(settings.fleetMaster[category])) {
      return res.status(404).json({ message: 'Category not found' });
    }

    settings.fleetMaster[category] = settings.fleetMaster[category].filter(
      i => i.toLowerCase() !== decodedItem.toLowerCase()
    );
    settings.markModified('fleetMaster');
    await settings.save();

    res.json({ success: true, items: settings.fleetMaster[category] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
