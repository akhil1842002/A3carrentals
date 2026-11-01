const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { adminAuth } = require('../middleware/auth');

// GET /api/notifications - List admin notifications
router.get('/', adminAuth, async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit) || 40);
    const filter = {};
    if (req.query.unreadOnly === 'true') {
      filter.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ read: false })
    ]);

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/:id/read - Mark one notification as read
router.put('/:id/read', adminAuth, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    const unreadCount = await Notification.countDocuments({ read: false });
    res.json({ notification, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', adminAuth, async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/clear/all or DELETE /api/notifications - Clear all notifications
router.delete('/clear/all', adminAuth, async (req, res) => {
  try {
    const filter = req.query.readOnly === 'true' ? { read: true } : {};
    await Notification.deleteMany(filter);
    const unreadCount = await Notification.countDocuments({ read: false });
    res.json({ message: 'Notifications cleared successfully', unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/', adminAuth, async (req, res) => {
  try {
    const filter = req.query.readOnly === 'true' ? { read: true } : {};
    await Notification.deleteMany(filter);
    const unreadCount = await Notification.countDocuments({ read: false });
    res.json({ message: 'Notifications cleared successfully', unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    const unreadCount = await Notification.countDocuments({ read: false });
    res.json({ message: 'Notification deleted', unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
