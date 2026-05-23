const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicAdmin(admin) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    created_at: admin.created_at,
    updated_at: admin.updated_at,
    last_login_at: admin.last_login_at,
  };
}

function signAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      token_type: "admin",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT secret is not configured.");
    error.statusCode = 500;
    throw error;
  }
}

router.post("/register", async (req, res, next) => {
  try {
    requireJwtSecret();

    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const passkey = String(req.body.passkey || "");
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const configuredPasskey = process.env.ADMIN_REGISTER_PASSKEY;

    if (!configuredPasskey) {
      return res.status(500).json({ message: "Admin registration passkey is not configured." });
    }

    if (!name || !email || !password || !passkey) {
      return res.status(400).json({ message: "Name, email, password, and passkey are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    if (passkey !== configuredPasskey) {
      return res.status(403).json({ message: "Invalid admin registration passkey." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO admins (name, email, password_hash, phone, role)
       VALUES (?, ?, ?, ?, 'admin')`,
      [name, email, passwordHash, phone]
    );

    const [rows] = await db.execute(
      `SELECT id, name, email, phone, role, created_at, updated_at, last_login_at
       FROM admins
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const admin = rows[0];
    return res.status(201).json({
      message: "Admin registered successfully.",
      token: signAdminToken(admin),
      admin: publicAdmin(admin),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An admin with this email already exists." });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    requireJwtSecret();

    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await db.execute(
      `SELECT id, name, email, password_hash, phone, role, is_active, created_at, updated_at, last_login_at
       FROM admins
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const admin = rows[0];
    const passwordMatches = admin ? await bcrypt.compare(password, admin.password_hash) : false;

    if (!admin || !admin.is_active || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await db.execute("UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [admin.id]);

    const freshAdmin = {
      ...admin,
      last_login_at: new Date(),
    };

    return res.json({
      message: "Login successful.",
      token: signAdminToken(admin),
      admin: publicAdmin(freshAdmin),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, phone, role, created_at, updated_at, last_login_at
       FROM admins
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [req.admin.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Admin account was not found." });
    }

    return res.json({ admin: publicAdmin(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
