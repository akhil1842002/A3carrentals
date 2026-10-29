const Notification = require('../models/Notification');

/**
 * Creates an admin notification with built-in deduplication.
 * If an identical notification for the same booking and type was created in the last 2 minutes, it is skipped.
 */
async function notifyAdmin({
  type,
  title,
  message,
  booking,
  bookingReference = '',
  customerName = '',
  amount = 0,
  source = 'system',
  link = '',
  metadata = {}
}) {
  try {
    // Deduplication check: avoid double-logging within 2 minutes for the same booking & type
    if (booking) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const existing = await Notification.findOne({
        booking,
        type,
        createdAt: { $gte: twoMinutesAgo }
      });

      if (existing) {
        return existing;
      }
    }

    const notif = new Notification({
      type,
      title,
      message,
      booking,
      bookingReference,
      customerName,
      amount,
      source,
      link: link || (bookingReference ? `/bookings?search=${bookingReference}` : '/bookings'),
      metadata
    });

    await notif.save();
    return notif;
  } catch (err) {
    console.error('Failed to create admin notification:', err.message);
    return null;
  }
}

module.exports = { notifyAdmin };
