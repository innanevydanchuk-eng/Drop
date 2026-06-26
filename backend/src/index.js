import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'clientdrop-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Future routes:
// app.use('/api/portals', portalRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/approvals', approvalRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/client', clientPortalRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ClientDrop API running on http://0.0.0.0:${PORT}`);
});
