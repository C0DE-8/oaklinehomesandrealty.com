const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");
const { requireUser } = require("../middleware/authMiddleware");

const router = express.Router();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  };
}

function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    const error = new Error("JWT secret is not configured.");
    error.statusCode = 500;
    throw error;
  }
}

function signUserToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      token_type: "user",
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

router.post("/register", async (req, res, next) => {
  try {
    requireJwtSecret();

    const firstName = String(req.body.firstName || req.body.first_name || "").trim();
    const lastName = String(req.body.lastName || req.body.last_name || "").trim() || null;
    const email = normalizeEmail(req.body.email);
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const password = String(req.body.password || "");

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: "First name, email, and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO users (first_name, last_name, email, phone, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, phone, passwordHash]
    );

    const [rows] = await db.execute(
      `SELECT id, first_name, last_name, email, phone, created_at, updated_at, last_login_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    const user = rows[0];

    return res.status(201).json({
      message: "User registered successfully.",
      token: signUserToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "A user with this email already exists." });
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
      `SELECT id, first_name, last_name, email, phone, password_hash, is_active, created_at, updated_at, last_login_at
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !user.is_active || !passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    await db.execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    return res.json({
      message: "Login successful.",
      token: signUserToken(user),
      user: publicUser({ ...user, last_login_at: new Date() }),
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireUser, async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, first_name, last_name, email, phone, created_at, updated_at, last_login_at
       FROM users
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "User account was not found." });
    }

    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
