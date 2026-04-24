import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("bridge.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    age_range TEXT,
    preferred_name TEXT,
    appointment_date TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    care_reason TEXT,
    history_self_harm BOOLEAN,
    history_panic BOOLEAN,
    history_depression BOOLEAN,
    history_crisis BOOLEAN,
    consent_given BOOLEAN,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS check_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    mood INTEGER,
    anxiety INTEGER,
    stress INTEGER,
    sleep_duration REAL,
    sleep_quality INTEGER,
    energy INTEGER,
    appetite INTEGER,
    social_withdrawal INTEGER,
    panic_symptoms INTEGER,
    hopelessness INTEGER,
    self_harm_ideation INTEGER,
    journal_text TEXT,
    sentiment TEXT,
    themes TEXT,
    risk_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS voice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    transcript TEXT,
    mood_analysis TEXT,
    key_takeaways TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add sentiment and themes to check_ins if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(check_ins)").all() as any[];
const columnNames = tableInfo.map(col => col.name);

if (!columnNames.includes("sentiment")) {
  db.exec("ALTER TABLE check_ins ADD COLUMN sentiment TEXT");
}
if (!columnNames.includes("themes")) {
  db.exec("ALTER TABLE check_ins ADD COLUMN themes TEXT");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/user", (req, res) => {
    const { id, name, age_range, preferred_name, appointment_date, emergency_contact_name, emergency_contact_phone, care_reason, history_self_harm, history_panic, history_depression, history_crisis, consent_given } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, name, age_range, preferred_name, appointment_date, emergency_contact_name, emergency_contact_phone, care_reason, history_self_harm, history_panic, history_depression, history_crisis, consent_given)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, age_range, preferred_name, appointment_date, emergency_contact_name, emergency_contact_phone, care_reason, history_self_harm ? 1 : 0, history_panic ? 1 : 0, history_depression ? 1 : 0, history_crisis ? 1 : 0, consent_given ? 1 : 0);
    res.json({ success: true });
  });

  app.get("/api/user/:id", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
    res.json(user || null);
  });

  app.post("/api/check-in", (req, res) => {
    const { user_id, mood, anxiety, stress, sleep_duration, sleep_quality, energy, appetite, social_withdrawal, panic_symptoms, hopelessness, self_harm_ideation, journal_text, sentiment, themes, risk_score } = req.body;
    const stmt = db.prepare(`
      INSERT INTO check_ins (user_id, mood, anxiety, stress, sleep_duration, sleep_quality, energy, appetite, social_withdrawal, panic_symptoms, hopelessness, self_harm_ideation, journal_text, sentiment, themes, risk_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user_id, mood, anxiety, stress, sleep_duration, sleep_quality, energy, appetite, social_withdrawal, panic_symptoms, hopelessness, self_harm_ideation, journal_text, sentiment, themes, risk_score);
    res.json({ success: true });
  });

  app.get("/api/check-ins/:user_id", (req, res) => {
    const checkIns = db.prepare("SELECT * FROM check_ins WHERE user_id = ? ORDER BY created_at DESC").all(req.params.user_id);
    res.json(checkIns);
  });

  app.post("/api/voice-session", (req, res) => {
    const { user_id, transcript, mood_analysis, key_takeaways } = req.body;
    const stmt = db.prepare("INSERT INTO voice_sessions (user_id, transcript, mood_analysis, key_takeaways) VALUES (?, ?, ?, ?)");
    stmt.run(user_id, transcript, mood_analysis, key_takeaways);
    res.json({ success: true });
  });

  app.get("/api/voice-sessions/:user_id", (req, res) => {
    const sessions = db.prepare("SELECT * FROM voice_sessions WHERE user_id = ? ORDER BY created_at DESC").all(req.params.user_id);
    res.json(sessions);
  });

  app.post("/api/chat", (req, res) => {
    const { user_id, role, content } = req.body;
    const stmt = db.prepare("INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)");
    stmt.run(user_id, role, content);
    res.json({ success: true });
  });

  app.get("/api/chat/:user_id", (req, res) => {
    const history = db.prepare("SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC").all(req.params.user_id);
    res.json(history);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
