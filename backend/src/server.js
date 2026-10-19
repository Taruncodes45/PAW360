/**
 * PawSense360 — Backend Proxy Server
 * ============================================================
 * Sits between the dashboard and the Blynk API.
 * Keeps the Blynk auth token in server-side environment variables.
 * The browser NEVER sees the raw Blynk token.
 *
 * Usage:
 *   1. Copy .env.example → backend/.env and fill in credentials
 *   2. npm install (in backend/)
 *   3. npm run dev
 *
 * API Routes:
 *   GET /api/telemetry      — Latest device telemetry from Blynk
 *   GET /api/history/health — Historical HR and SpO2 (requires separate storage)
 *   GET /api/history/activity — Activity history
 *   GET /api/alerts         — Alert history
 *   GET /api/health         — Backend health check
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readBlynkPins, buildTelemetrySnapshot } from './blynkAdapter.js';
import { MockAdapter } from './mockAdapter.js';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// In-memory alert store (production: use SQLite or Postgres)
let alertHistory = [];

// ─── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    blynkConfigured: !!process.env.BLYNK_AUTH_TOKEN &&
                     !process.env.BLYNK_AUTH_TOKEN.startsWith('your_'),
    telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN &&
                        !process.env.TELEGRAM_BOT_TOKEN.startsWith('your_'),
    timestamp: new Date().toISOString(),
  });
});

// ─── Telemetry ─────────────────────────────────────────────────────────────────
app.get('/api/telemetry', async (_req, res) => {
  const token = process.env.BLYNK_AUTH_TOKEN;

  // Check if Blynk is configured with real credentials
  if (!token || token.startsWith('your_')) {
    console.log('[Backend] Blynk not configured — returning mock telemetry');
    const mock = new MockAdapter();
    return res.json(mock.getTelemetry());
  }

  try {
    const blynkData = await readBlynkPins(token);
    const snapshot  = buildTelemetrySnapshot(blynkData);
    return res.json(snapshot);
  } catch (err) {
    console.error('[Backend] Blynk fetch error:', err.message);
    // Return unavailable snapshot rather than crashing
    return res.status(503).json({
      error: 'Blynk unavailable',
      message: err.message,
      dataSource: 'unavailable',
    });
  }
});

// ─── Health History ────────────────────────────────────────────────────────────
app.get('/api/history/health', (_req, res) => {
  // NOTE: Blynk does not provide automatic historical storage for arbitrary intervals.
  // For persistent history, you need to:
  //   Option A: Log telemetry to a local SQLite DB on this server.
  //   Option B: Use Blynk Data Streams with Blynk's history widget (limited).
  //   Option C: Export to InfluxDB or similar time-series DB.
  // Currently returns an empty history; extend this when storage is implemented.
  console.log('[Backend] History requested — returning empty (no persistent storage configured)');
  res.json({ heartRate: [], spo2: [] });
});

// ─── Activity History ──────────────────────────────────────────────────────────
app.get('/api/history/activity', (_req, res) => {
  res.json({ events: [] });
});

// ─── Alerts ────────────────────────────────────────────────────────────────────
app.get('/api/alerts', (_req, res) => {
  res.json(alertHistory);
});

app.post('/api/alerts', (req, res) => {
  const alert = { ...req.body, id: `alert-${Date.now()}` };
  alertHistory.unshift(alert);
  if (alertHistory.length > 100) alertHistory = alertHistory.slice(0, 100);
  res.json({ ok: true, id: alert.id });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[PawSense360 Backend] Running on http://localhost:${PORT}`);
  console.log(`[Backend] Blynk configured: ${!!process.env.BLYNK_AUTH_TOKEN &&
              !process.env.BLYNK_AUTH_TOKEN.startsWith('your_')}`);
  console.log('[Backend] Note: Blynk token is NEVER sent to the browser.\n');
});

export default app;
