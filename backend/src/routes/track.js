import { Router } from 'express';
import { logEvent, getTotalEventCounts, getEventStats, getRecentEvents, getUserCount, getPortalCount } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/track/event — log an event (requires auth)
router.post('/event', requireAuth, (req, res) => {
  try {
    const { eventType, portalId, metadata } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: 'eventType is required' });
    }
    const valid = ['signup', 'portal_created', 'file_uploaded', 'payment_made', 'approval_requested', 'approval_granted'];
    if (!valid.includes(eventType)) {
      return res.status(400).json({ error: `Invalid eventType. Must be: ${valid.join(', ')}` });
    }
    const event = logEvent({ eventType, userId: req.user.id, portalId: portalId || null, metadata: metadata || null });
    res.status(201).json({ message: 'Event logged', event });
  } catch (err) {
    console.error('Track event error:', err);
    res.status(500).json({ error: 'Server error logging event' });
  }
});

// GET /api/track/stats — aggregate lead stats (requires auth)
router.get('/stats', requireAuth, (req, res) => {
  try {
    const totals = getTotalEventCounts();
    const dailyStats = getEventStats();
    const userCount = getUserCount();
    const portalCount = getPortalCount();
    const recent = getRecentEvents(10);
    const m = {};
    for (const r of totals) m[r.event_type] = r.count;
    res.json({
      summary: {
        total_users: userCount,
        total_portals: portalCount,
        total_signups: m.signup || 0,
        total_portals_created: m.portal_created || 0,
        total_files_uploaded: m.file_uploaded || 0,
        total_payments: m.payment_made || 0,
      },
      daily: dailyStats,
      recent,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

export default router;