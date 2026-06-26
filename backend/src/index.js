import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? 3000 : (process.env.PORT || 8001);
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// In production, serve the built frontend
if (isProd) {
  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
}

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'clientdrop-api' });
});

// Create portal endpoint (placeholder)
app.post('/api/portals', (req, res) => {
  const { name, email, clientName, projectName } = req.body;

  if (!name || !email || !clientName || !projectName) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const slug = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // TODO: Save to database, send email

  res.status(201).json({
    message: 'Portal created!',
    portal: {
      slug,
      url: `/p/${slug}`,
      clientName,
      projectName,
    },
  });
});

// Get all portals (placeholder)
app.get('/api/portals', (req, res) => {
  res.json({ portals: [] });
});

// In production, serve index.html for SPA routes (client portal pages)
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClientDrop API running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
});