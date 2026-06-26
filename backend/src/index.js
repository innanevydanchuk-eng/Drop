import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? 3000 : (process.env.PORT || 8001);
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (replaced by DB later)
let portals = [
  {
    id: 'p-1',
    slug: 'studio-nova',
    clientName: 'Studio Nova',
    projectName: 'Brand Identity',
    status: 'needs-files',
    createdAt: new Date(Date.now() - 1209600000).toISOString(),
    files: 3,
    amount: 2400,
  },
  {
    id: 'p-2',
    slug: 'peak-roasters',
    clientName: 'Peak Roasters',
    projectName: 'Website Redesign',
    status: 'review',
    createdAt: new Date(Date.now() - 864000000).toISOString(),
    files: 0,
    amount: 4800,
  },
  {
    id: 'p-3',
    slug: 'clara-mendez',
    clientName: 'Clara Mendez',
    projectName: 'Social Content',
    status: 'payment-due',
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    files: 0,
    amount: 1200,
  },
  {
    id: 'p-4',
    slug: 'orbit-labs',
    clientName: 'Orbit Labs',
    projectName: 'UI Audit',
    status: 'complete',
    createdAt: new Date(Date.now() - 2592000000).toISOString(),
    files: 0,
    amount: 3600,
  },
];

// In production, serve the built frontend
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
}

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'clientdrop-api', portals: portals.length });
});

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  const active = portals.filter(p => p.status !== 'complete').length;
  const pendingApprovals = portals.filter(p => p.status === 'review').length;
  const paidThisMonth = portals
    .filter(p => p.status === 'complete')
    .reduce((sum, p) => sum + p.amount, 0);
  const needsFiles = portals.filter(p => p.status === 'needs-files').length;
  const paymentDue = portals.filter(p => p.status === 'payment-due').length;

  res.json({
    activeClients: active,
    pendingApprovals,
    paidThisMonth: `$${(paidThisMonth / 1000).toFixed(1)}k`,
    needsFiles,
    paymentDue,
  });
});

// Get all portals
app.get('/api/portals', (req, res) => {
  const sorted = [...portals].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ portals: sorted });
});

// Get single portal
app.get('/api/portals/:slug', (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: 'Portal not found' });
  res.json({ portal });
});

// Create portal
app.post('/api/portals', (req, res) => {
  const { clientName, projectName } = req.body;

  if (!clientName || !projectName) {
    return res.status(400).json({ error: 'Client name and project name are required' });
  }

  const slug = projectName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Generate unique slug if taken
  let finalSlug = slug;
  let counter = 1;
  while (portals.find(p => p.slug === finalSlug)) {
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  const initials = clientName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const newPortal = {
    id: `p-${crypto.randomUUID().slice(0, 8)}`,
    slug: finalSlug,
    clientName,
    projectName,
    initials,
    status: 'active',
    createdAt: new Date().toISOString(),
    files: 0,
    amount: 0,
  };

  portals.push(newPortal);

  res.status(201).json({
    message: 'Portal created!',
    portal: newPortal,
  });
});

// Update portal status
app.patch('/api/portals/:slug', (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: 'Portal not found' });

  const { status } = req.body;
  if (status) portal.status = status;

  res.json({ portal });
});

// In production, serve index.html for SPA routes
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClientDrop API running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
});