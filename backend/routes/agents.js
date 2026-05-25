const express = require("express");

const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, phone, market, title, bio, photo_url, updated_at
         FROM agents
        WHERE is_active = 1
        ORDER BY updated_at DESC
        LIMIT 12`
    );

    return res.json({ agents: rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, phone, market, title, bio, photo_url, updated_at
         FROM agents
        WHERE id = ? AND is_active = 1
        LIMIT 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Agent not found." });
    }

    return res.json({ agent: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
