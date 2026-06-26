import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import fs from "fs";
import authRoutes from "./routes/auth.js";
import analyticsRoutes from "./routes/analytics.js";
import trackRoutes from "./routes/track.js";
import trackRoutes from "./routes/track.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.NODE_ENV === "production" ? 3000 : (process.env.PORT || 3001);
const isProd = process.env.NODE_ENV === "production";

// Ensure uploads dir
const uploadsDir = join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const portalDir = join(uploadsDir, req.params.slug);
    if (!fs.existsSync(portalDir)) fs.mkdirSync(portalDir, { recursive: true });
    cb(null, portalDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

if (isProd) {
  const distPath = join(__dirname, "../../frontend/dist");
  app.use(express.static(distPath));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "clientdrop-api", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/track", trackRoutes);

// Portal data store (in-memory, persisted to file for restarts)
const DATA_FILE = join(__dirname, "..", "portals.json");

function loadPortals() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (e) { console.error("Error loading portals:", e.message); }
  return getDefaultPortals();
}

function savePortals(portals) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(portals, null, 2));
  } catch (e) { console.error("Error saving portals:", e.message); }
}

function getDefaultPortals() {
  return [
    { id: "1", slug: "studio-nova", clientName: "Studio Nova", projectName: "Brand identity", status: "needs-files", initials: "SN", avatarBg: "#EFF4FF", avatarColor: "#2563EB", notes: "", files: [], createdAt: new Date(Date.now() - 1209600000).toISOString() },
    { id: "2", slug: "peak-roasters", clientName: "Peak Roasters", projectName: "Website redesign", status: "review", initials: "PR", avatarBg: "#F0FDF4", avatarColor: "#16A34A", notes: "", files: [], createdAt: new Date(Date.now() - 864000000).toISOString() },
    { id: "3", slug: "clara-mendez", clientName: "Clara Mendez", projectName: "Social content", status: "payment-due", initials: "CM", avatarBg: "#FEF3C7", avatarColor: "#92400E", notes: "", files: [], createdAt: new Date(Date.now() - 604800000).toISOString() },
    { id: "4", slug: "orbit-labs", clientName: "Orbit Labs", projectName: "UI audit", status: "complete", initials: "OL", avatarBg: "#F0FDF4", avatarColor: "#16A34A", notes: "", files: [], createdAt: new Date(Date.now() - 2592000000).toISOString() },
  ];
}

let portals = loadPortals();

// Stats
app.get("/api/stats", (req, res) => {
  const active = portals.filter(p => !["complete", "paid"].includes(p.status)).length;
  const pendingApprovals = portals.filter(p => p.status === "review").length;
  const paidThisMonth = 6200;
  const needsFiles = portals.filter(p => p.status === "needs-files").length;
  const paymentDue = portals.filter(p => p.status === "payment-due").length;
  res.json({ activeClients: active, pendingApprovals, paidThisMonth, needsFiles, paymentDue });
});

// List portals
app.get("/api/portals", (req, res) => {
  res.json({ portals });
});

// Get single portal (for client portal page)
app.get("/api/portals/:slug", (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: "Portal not found" });
  res.json({ portal });
});

// Create portal
app.post("/api/portals", (req, res) => {
  const { name, email, clientName, projectName } = req.body;
  if (!name || !email || !clientName || !projectName) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const slug = projectName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const initials = clientName.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
  const newPortal = {
    id: String(Date.now()), slug, clientName, projectName, status: "needs-files",
    initials, avatarBg: "#EFF4FF", avatarColor: "#2563EB", notes: "", files: [], createdAt: new Date().toISOString(),
  };
  portals.unshift(newPortal);
  savePortals(portals);
  res.status(201).json({ message: "Portal created!", portal: newPortal });
});

// Update portal (status, notes)
app.patch("/api/portals/:slug", (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: "Portal not found" });
  const allowed = ["status", "notes"];
  for (const key of allowed) {
    if (req.body[key] !== undefined) portal[key] = req.body[key];
  }
  savePortals(portals);
  res.json({ portal });
});

// File upload
app.post("/api/portals/:slug/files", upload.array("files", 10), (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: "Portal not found" });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const uploaded = req.files.map(f => ({
    name: f.originalname,
    size: f.size,
    type: f.mimetype,
    path: `/uploads/${portal.slug}/${f.filename}`,
    uploadedAt: new Date().toISOString(),
  }));

  portal.files = [...(portal.files || []), ...uploaded];
  if (portal.status === "needs-files") portal.status = "has-files";
  savePortals(portals);

  res.status(200).json({ message: "Files uploaded", files: uploaded });
});

// Get files for a portal
app.get("/api/portals/:slug/files", (req, res) => {
  const portal = portals.find(p => p.slug === req.params.slug);
  if (!portal) return res.status(404).json({ error: "Portal not found" });
  res.json({ files: portal.files || [] });
});

// SPA fallback
if (isProd) {
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../../frontend/dist/index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ClientDrop running on http://0.0.0.0:${PORT} (${isProd ? "production" : "development"})`);
});