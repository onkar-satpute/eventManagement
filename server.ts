import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "public", "uploads", "rules");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database("events.db");
db.pragma("foreign_keys = ON");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    mobile TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    image TEXT NOT NULL,
    players_per_team INTEGER NOT NULL DEFAULT 1,
    max_teams INTEGER NOT NULL DEFAULT 100,
    max_players INTEGER NOT NULL DEFAULT 0,
    rules_pdf TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    team_name TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Migration for existing events table if columns missing
try {
  db.exec("ALTER TABLE events ADD COLUMN players_per_team INTEGER NOT NULL DEFAULT 1");
} catch (e) {}
try {
  db.exec("ALTER TABLE events ADD COLUMN max_teams INTEGER NOT NULL DEFAULT 100");
} catch (e) {}
try {
  db.exec("ALTER TABLE events ADD COLUMN max_players INTEGER NOT NULL DEFAULT 0");
  // Update existing events to have correct max_players
  db.exec("UPDATE events SET max_players = players_per_team * max_teams WHERE max_players = 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE registrations ADD COLUMN team_name TEXT");
} catch (e) {}

try {
  db.exec("ALTER TABLE events ADD COLUMN rules_pdf TEXT");
} catch (e) {}

// Migration for messages table to make user_id optional and remove UNIQUE
try {
  const tableInfo: any = db.prepare("PRAGMA table_info(messages)").all();
  const userIdCol = tableInfo.find((c: any) => c.name === 'user_id');
  if (userIdCol && userIdCol.notnull === 1) {
    db.exec("ALTER TABLE messages RENAME TO messages_old");
    db.exec(`
      CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.exec("INSERT INTO messages (id, user_id, name, mobile, message, created_at) SELECT id, user_id, name, mobile, message, created_at FROM messages_old");
    db.exec("DROP TABLE messages_old");
  }
} catch (e) {
  console.error("Migration error:", e);
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (firstName, lastName, mobile, password, role) VALUES (?, ?, ?, ?, ?)")
    .run("Admin", "User", "9999999999", hashedPassword, "admin");
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());
  // Serve uploaded files with headers that allow framing in the preview environment
  app.use("/uploads", (req, res, next) => {
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://ai.studio.google.com https://*.run.app");
    next();
  }, express.static(path.join(process.cwd(), "public", "uploads")));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      (req as any).user = user;
      next();
    });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if ((req as any).user.role !== 'admin') return res.sendStatus(403);
    next();
  };

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { firstName, lastName, mobile, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (firstName, lastName, mobile, password) VALUES (?, ?, ?, ?)")
        .run(firstName, lastName, mobile, hashedPassword);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { mobile, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE mobile = ?").get(mobile);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, role: user.role, firstName: user.firstName }, JWT_SECRET);
    res.json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role } });
  });

  // Events API
  app.get("/api/events", (req, res) => {
    const category = req.query.category;
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    let userId: number | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid token for public events list
      }
    }

    let events;
    if (category) {
      events = db.prepare("SELECT * FROM events WHERE category = ?").all(category);
    } else {
      events = db.prepare("SELECT * FROM events").all();
    }
    
    // Add registration count and isRegistered flag to each event
    const eventsWithCount = events.map((event: any) => {
      const count: any = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE event_id = ?").get(event.id);
      let isRegistered = false;
      if (userId) {
        const reg = db.prepare("SELECT id FROM registrations WHERE user_id = ? AND event_id = ?").get(userId, event.id);
        isRegistered = !!reg;
      }
      return { ...event, registrationCount: count.count, isRegistered };
    });
    
    res.json(eventsWithCount);
  });

  app.post("/api/events", authenticateToken, isAdmin, upload.single('rules_pdf'), (req, res) => {
    const { name, category, date, players_per_team, max_teams, image } = req.body;
    const rules_pdf = req.file ? `/uploads/rules/${req.file.filename}` : null;
    const max_players = parseInt(players_per_team) * parseInt(max_teams);
    const result = db.prepare("INSERT INTO events (name, category, date, players_per_team, max_teams, max_players, image, rules_pdf) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(name, category, date, parseInt(players_per_team), parseInt(max_teams), max_players, image, rules_pdf);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/events/:id", authenticateToken, isAdmin, upload.single('rules_pdf'), (req, res) => {
    const { name, category, date, players_per_team, max_teams, image } = req.body;
    const eventId = req.params.id;
    const max_players = parseInt(players_per_team) * parseInt(max_teams);
    
    try {
      let query = "UPDATE events SET name = ?, category = ?, date = ?, players_per_team = ?, max_teams = ?, max_players = ?, image = ?";
      const params = [name, category, date, parseInt(players_per_team), parseInt(max_teams), max_players, image];

      if (req.file) {
        query += ", rules_pdf = ?";
        params.push(`/uploads/rules/${req.file.filename}`);
      }

      query += " WHERE id = ?";
      params.push(eventId);

      db.prepare(query).run(...params);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/events/:id", authenticateToken, isAdmin, (req, res) => {
    const eventId = req.params.id;
    // Delete registrations first (which will cascade to players)
    db.prepare("DELETE FROM registrations WHERE event_id = ?").run(eventId);
    // Then delete the event
    db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
    res.json({ success: true });
  });

  // Registrations API
  app.post("/api/registrations", authenticateToken, (req, res) => {
    const { event_id, team_name, players } = req.body;
    const user_id = (req as any).user.id;
    
    try {
      const event: any = db.prepare("SELECT * FROM events WHERE id = ?").get(event_id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      // Check registration deadline (1 day before event at 12:00 AM)
      const eventDate = new Date(event.date);
      const deadline = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate() - 1, 0, 0, 0);
      const now = new Date();
      
      if (now >= deadline) {
        return res.status(400).json({ error: "Registration is closed (deadline passed)" });
      }

      // Check if full
      const count: any = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE event_id = ?").get(event_id);
      
      if (count.count >= event.max_teams) {
        return res.status(400).json({ error: "All slots are full" });
      }

      // Check if user already registered for this event
      const existing = db.prepare("SELECT * FROM registrations WHERE user_id = ? AND event_id = ?").get(user_id, event_id);
      if (existing) {
        return res.status(400).json({ error: "You have already registered for this event" });
      }

      // Transaction for registration and players
      const insertRegistration = db.prepare("INSERT INTO registrations (user_id, event_id, team_name) VALUES (?, ?, ?)");
      const insertPlayer = db.prepare("INSERT INTO players (registration_id, player_name, mobile_number) VALUES (?, ?, ?)");

      const transaction = db.transaction((regData: any, playersData: any[]) => {
        const result = insertRegistration.run(regData.user_id, regData.event_id, regData.team_name);
        const registrationId = result.lastInsertRowid;
        
        // If single player event and no players provided, use user details
        if (event.players_per_team === 1 && (!playersData || playersData.length === 0)) {
          const user: any = db.prepare("SELECT firstName, lastName, mobile FROM users WHERE id = ?").get(user_id);
          if (user) {
            insertPlayer.run(registrationId, `${user.firstName} ${user.lastName}`, user.mobile);
          }
        } else if (playersData && Array.isArray(playersData)) {
          for (const player of playersData) {
            insertPlayer.run(registrationId, player.player_name, player.mobile_number);
          }
        }
        return registrationId;
      });

      transaction({ user_id, event_id, team_name }, players || []);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Registration Error:", error);
      res.status(400).json({ error: error.message || "An error occurred during registration" });
    }
  });

  app.get("/api/my-events", authenticateToken, (req, res) => {
    const events = db.prepare(`
      SELECT e.*, r.team_name, (SELECT COUNT(*) FROM players p WHERE p.registration_id = r.id) as player_count
      FROM events e
      JOIN registrations r ON e.id = r.event_id
      WHERE r.user_id = ?
    `).all((req as any).user.id);
    res.json(events);
  });

  // Admin: View Registered Teams and Players
  app.get("/api/admin/registrations/:eventId", authenticateToken, isAdmin, (req, res) => {
    const registrations = db.prepare(`
      SELECT r.id, r.team_name, u.firstName, u.lastName, u.mobile as captain_mobile
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
    `).all(req.params.eventId);

    const registrationsWithPlayers = registrations.map((reg: any) => {
      const players = db.prepare("SELECT * FROM players WHERE registration_id = ?").all(reg.id);
      return { ...reg, players };
    });

    res.json(registrationsWithPlayers);
  });

  // Admin: Export to CSV
  app.get("/api/admin/export/:eventId", authenticateToken, isAdmin, (req, res) => {
    const event: any = db.prepare("SELECT name FROM events WHERE id = ?").get(req.params.eventId);
    if (!event) return res.status(404).send("Event not found");

    const data = db.prepare(`
      SELECT r.team_name, p.player_name, p.mobile_number
      FROM registrations r
      JOIN players p ON r.id = p.registration_id
      WHERE r.event_id = ?
    `).all(req.params.eventId);

    let csv = "Event Name,Team Name,Player Name,Mobile Number\n";
    data.forEach((row: any) => {
      csv += `"${event.name}","${row.team_name || ''}","${row.player_name}","${row.mobile_number}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event_${req.params.eventId}_registrations.csv`);
    res.send(csv);
  });
  
  // Messages API
  app.post("/api/messages", (req, res) => {
    const { name, mobile, message } = req.body;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user_id = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        user_id = decoded.id;
      } catch (err) {
        // Ignore invalid token
      }
    }
    
    try {
      if (user_id) {
        // Check if user already sent a message (optional, maybe we want to allow multiple now)
        const existing = db.prepare("SELECT id FROM messages WHERE user_id = ?").get(user_id);
        if (existing) {
          return res.status(400).json({ error: "You have already sent a message. Only one message per profile is allowed." });
        }
      }
      
      db.prepare("INSERT INTO messages (user_id, name, mobile, message) VALUES (?, ?, ?, ?)")
        .run(user_id, name, mobile, message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/admin/messages", authenticateToken, isAdmin, (req, res) => {
    const messages = db.prepare("SELECT * FROM messages ORDER BY created_at DESC").all();
    res.json(messages);
  });
  
  app.delete("/api/admin/messages/:id", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM messages WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const hmrPort = Number(process.env.HMR_PORT || 24678);
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: hmrPort,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
