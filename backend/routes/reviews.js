const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Car = require('../models/Car');
const Tyre = require('../models/Tyre');
const Driver = require('../models/Driver');
const { userAuth, adminAuth } = require('../middleware/auth');

// 1. GET reviews for landing page slider (public) - strictly show ONLY what admin has featured
router.get('/landing', async (req, res) => {
  try {
    const reviews = await Review.find({ showOnLanding: true })
      .populate('user', 'name avatar')
      .populate('car', 'name brand model images rating')
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(15);

    // Strictly return only admin-approved reviews - no unwanted automatic fallback
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET reviews for a car, tyre, or driver (public/admin)
router.get('/', async (req, res) => {
  try {
    const { targetType, carId, tyreId, driverId, showOnLanding, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (targetType) filter.targetType = targetType;
    if (carId) filter.car = carId;
    if (tyreId) filter.tyre = tyreId;
    if (driverId) filter.driver = driverId;
    if (showOnLanding !== undefined) filter.showOnLanding = showOnLanding === 'true';

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name email avatar')
      .populate('car', 'name brand model images rating')
      .populate('tyre', 'name brand size image')
      .populate('driver', 'name phone rating avatar licenceNumber')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. GET reviews by user ID (admin or user)
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId })
      .populate('car', 'name brand model images')
      .populate('tyre', 'name brand size image')
      .populate('driver', 'name phone rating avatar')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. POST submit combined trip review (car + optional driver)
router.post('/trip', userAuth, async (req, res) => {
  try {
    const { bookingId, carId, carRating, carTitle, carComment, driverId, driverRating, driverTitle, driverComment } = req.body;

    if (!bookingId || !carId || !carRating || !carComment) {
      return res.status(400).json({ message: 'Vehicle rating and feedback comment are required' });
    }

    const createdReviews = [];

    // 1. Vehicle Review
    const carReview = new Review({
      user: req.user.id,
      targetType: 'car',
      car: carId,
      booking: bookingId,
      rating: Math.max(1, Math.min(5, Number(carRating))),
      title: (carTitle || '').trim(),
      comment: carComment.trim()
    });
    await carReview.save();
    createdReviews.push(carReview);

    // Recalculate Car Rating
    const allCarReviews = await Review.find({ car: carId });
    if (allCarReviews.length > 0) {
      const carAvg = allCarReviews.reduce((sum, r) => sum + r.rating, 0) / allCarReviews.length;
      await Car.findByIdAndUpdate(carId, {
        rating: Math.round(carAvg * 10) / 10,
        reviewCount: allCarReviews.length
      });
    }

    // 2. Driver Review (if driverId & driverRating provided)
    if (driverId && driverRating) {
      const driverReview = new Review({
        user: req.user.id,
        targetType: 'driver',
        driver: driverId,
        car: carId,
        booking: bookingId,
        rating: Math.max(1, Math.min(5, Number(driverRating))),
        title: (driverTitle || 'Driver Service Feedback').trim(),
        comment: (driverComment || carComment).trim()
      });
      await driverReview.save();
      createdReviews.push(driverReview);

      // Recalculate Driver Rating
      const allDriverReviews = await Review.find({ driver: driverId });
      if (allDriverReviews.length > 0) {
        const driverAvg = allDriverReviews.reduce((sum, r) => sum + r.rating, 0) / allDriverReviews.length;
        await Driver.findByIdAndUpdate(driverId, {
          rating: Math.round(driverAvg * 10) / 10
        });
      }
    }

    res.status(201).json({
      message: driverId ? 'Vehicle and driver reviews submitted successfully!' : 'Vehicle review submitted successfully!',
      reviews: createdReviews
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. POST submit a single review (Customer)
router.post('/', userAuth, async (req, res) => {
  try {
    const { targetType, carId, tyreId, driverId, bookingId, orderId, rating, title, comment } = req.body;
    if (!targetType || !rating || !comment) {
      return res.status(400).json({ message: 'Target type, rating, and review comment are required' });
    }

    const review = new Review({
      user: req.user.id,
      targetType,
      car: targetType === 'car' ? carId : undefined,
      tyre: targetType === 'tyre' ? tyreId : undefined,
      driver: targetType === 'driver' ? driverId : undefined,
      booking: bookingId || undefined,
      order: orderId || undefined,
      rating: Number(rating),
      title: title || '',
      comment
    });

    await review.save();

    // Recalculate average rating on target car if applicable
    if (targetType === 'car' && carId) {
      const allCarReviews = await Review.find({ car: carId });
      const avg = allCarReviews.reduce((sum, r) => sum + r.rating, 0) / allCarReviews.length;
      await Car.findByIdAndUpdate(carId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allCarReviews.length
      });
    }

    // Recalculate average rating on target driver if applicable
    if (targetType === 'driver' && driverId) {
      const allDriverReviews = await Review.find({ driver: driverId });
      if (allDriverReviews.length > 0) {
        const avg = allDriverReviews.reduce((sum, r) => sum + r.rating, 0) / allDriverReviews.length;
        await Driver.findByIdAndUpdate(driverId, {
          rating: Math.round(avg * 10) / 10
        });
      }
    }

    res.status(201).json(await Review.findById(review._id).populate('car').populate('tyre').populate('driver').populate('user', 'name avatar'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. DELETE review (Admin moderation)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. PUT toggle showOnLanding (Admin approval/moderation)
router.put('/:id/landing', adminAuth, async (req, res) => {
  try {
    const { showOnLanding } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { showOnLanding: Boolean(showOnLanding) },
      { new: true }
    )
      .populate('user', 'name email avatar')
      .populate('car', 'name brand model images rating');

    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. POST create review by admin (e.g., from Google Reviews or manual entry)
router.post('/admin-create', adminAuth, async (req, res) => {
  try {
    const { authorName, rating, title, comment, source = 'google', showOnLanding = true, carId } = req.body;

    if (!authorName || !comment) {
      return res.status(400).json({ message: 'Reviewer name and review text are required' });
    }

    const review = new Review({
      authorName: authorName.trim(),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      title: (title || '').trim(),
      comment: comment.trim(),
      source: source || 'google',
      showOnLanding: Boolean(showOnLanding),
      targetType: carId ? 'car' : 'company',
      car: carId || undefined,
      verifiedPurchase: true
    });

    await review.save();

    if (carId) {
      const allCarReviews = await Review.find({ car: carId });
      const avg = allCarReviews.reduce((sum, r) => sum + r.rating, 0) / allCarReviews.length;
      await Car.findByIdAndUpdate(carId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allCarReviews.length
      });
    }

    const populated = await Review.findById(review._id)
      .populate('car', 'name brand model images rating')
      .populate('user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
