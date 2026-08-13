import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("database.sqlite");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    fantasia TEXT NOT NULL,
    endereco TEXT NOT NULL,
    city TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    cpf TEXT NOT NULL,
    phone TEXT NOT NULL,
    store TEXT NOT NULL,
    coupon_number TEXT NOT NULL,
    receipt_path TEXT,
    is_winner INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add phone column if it doesn't exist
try {
  db.exec("ALTER TABLE registrations ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
} catch (e) {
  // Column probably already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPass = process.env.ADMIN_PASS || "hexa2026";

    if (username === adminUser && password === adminPass) {
      res.json({ success: true, token: "mock-token-123" });
    } else {
      res.status(401).json({ error: "Usuário ou senha inválidos." });
    }
  });

  app.get("/api/stores", (req, res) => {
    const stores = db.prepare("SELECT * FROM stores ORDER BY fantasia ASC").all();
    res.json(stores);
  });

  app.post("/api/admin/stores", (req, res) => {
    try {
      const { cnpj, razaoSocial, fantasia, endereco, city } = req.body;
      if (!cnpj || !razaoSocial || !fantasia || !endereco || !city) {
        return res.status(400).json({ error: "Todos os campos da loja são obrigatórios." });
      }
      const stmt = db.prepare("INSERT INTO stores (cnpj, razao_social, fantasia, endereco, city) VALUES (?, ?, ?, ?, ?)");
      stmt.run(cnpj, razaoSocial, fantasia, endereco, city);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/winners", (req, res) => {
    const winners = db.prepare("SELECT name, store, cpf, coupon_number, prize_name FROM registrations WHERE is_winner = 1 ORDER BY created_at DESC").all();
    res.json(winners);
  });

  app.post("/api/register", (req, res) => {
    try {
      const { name, email, cpf, phone, store, couponNumber, receiptImage } = req.body;

      if (!name || !email || !cpf || !phone || !store || !couponNumber) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes." });
      }

      // Check if coupon number already used in the same store
      const existingCoupon = db.prepare("SELECT * FROM registrations WHERE store = ? AND coupon_number = ?").get(store, couponNumber);
      if (existingCoupon) {
        return res.status(403).json({ error: "Este cupom já foi cadastrado para esta loja!" });
      }


      // Winning logic: prizes per store with chances
      // Start date: 2026-09-01 (Dia das Crianças promotion)
      const startDate = new Date("2026-09-01T00:00:00");
      const now = new Date();

      let isWinner = 0;

      if (now >= startDate) {
        // Calculate weeks elapsed (0-indexed, so week 1 is 0)
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const elapsedWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
        const totalAvailablePrizes = elapsedWeeks + 1;

        // Count winners for this store
        const storeWinners = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE store = ? AND is_winner = 1").get(store) as { count: number };
        const prizesUsed = storeWinners ? storeWinners.count : 0;

        const remainingPrizes = totalAvailablePrizes - prizesUsed;

        if (remainingPrizes > 0) {
          // 5% chance if prizes are available
          isWinner = Math.random() < 0.05 ? 1 : 0;
        }
      }

      const stmt = db.prepare(`
        INSERT INTO registrations (name, email, cpf, phone, store, coupon_number, receipt_path, is_winner)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

const result = stmt.run(name, email, cpf, phone, store, couponNumber, "placeholder_path", isWinner);

      return res.json({ 
        success: true, 
        registrationId: result.lastInsertRowid,
        isWinner: isWinner === 1 
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: "Erro interno no servidor: " + error.message });
    }
  });

  app.get("/api/stats", (req, res) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM registrations").get() as { count: number };
    const winners = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE is_winner = 1").get() as { count: number };
    res.json({ total: total.count, winners: winners.count });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve("dist/index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Database initialized and ready.");
  });
}

startServer();
