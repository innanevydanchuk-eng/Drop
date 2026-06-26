import express from 'express';
import { logEvent, getFunnelStats, createLead } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Log an event (public or authenticated)
router.post('/event', (req, res) => {
  const { userId, portalId, eventType, source, email } = req.body;
  
  if (!eventType) {
    return res.status(400).json({ error: 'Event type is required' });
  }

  logEvent({ userId, portalId, eventType, source });

  // If email is provided, it might be a lead capture
  if (email) {
    createLead({ email, source, funnelStage: eventType });
  }

  res.status(201).json({ status: 'ok' });
});

// Get aggregate stats (authenticated - lead/admin view)
router.get('/overview', requireAuth, (req, res) => {
  const stats = getFunnelStats();
  res.json(stats);
});

// Get personal funnel data
router.get('/funnel', requireAuth, (req, res) => {
  // In a real app, we would filter by req.user.id
  const stats = getFunnelStats();
  res.json(stats);
});

export default router;
