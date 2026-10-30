const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Tyre = require('../models/Tyre');
const auth = require('../middleware/auth');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Multer config for tyre images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'tyres');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `tyre-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET all tyres (public)
router.get('/', async (req, res) => {
  try {
    const { brand, type, size, search, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (brand) filter.brand = { $in: brand.split(',') };
    if (type) filter.type = { $in: type.split(',') };
    if (size) filter.size = { $regex: size, $options: 'i' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const total = await Tyre.countDocuments(filter);
    const tyres = await Tyre.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ tyres, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single tyre
router.get('/:id', async (req, res) => {
  try {
    const tyre = await Tyre.findById(req.params.id);
    if (!tyre) return res.status(404).json({ message: 'Tyre not found' });
    res.json(tyre);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create tyre (admin)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const tyreData = { ...req.body };
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'tyres');
      tyreData.image = cloudUrl || `/uploads/tyres/${req.file.filename}`;
    }
    const tyre = new Tyre(tyreData);
    await tyre.save();
    res.status(201).json(tyre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update tyre (admin)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const tyreData = { ...req.body };
    if (req.file) {
      const cloudUrl = await uploadToCloudinary(req.file.path, 'tyres');
      tyreData.image = cloudUrl || `/uploads/tyres/${req.file.filename}`;
    }
    const tyre = await Tyre.findByIdAndUpdate(req.params.id, tyreData, { new: true, runValidators: true });
    if (!tyre) return res.status(404).json({ message: 'Tyre not found' });
    res.json(tyre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE tyre (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tyre = await Tyre.findByIdAndDelete(req.params.id);
    if (!tyre) return res.status(404).json({ message: 'Tyre not found' });
    res.json({ message: 'Tyre deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
