const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAdmin);

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

async function findActiveAdmin(adminId) {
  const [rows] = await db.execute(
    `SELECT id, name, email, password_hash, phone, role, created_at, updated_at, last_login_at
     FROM admins
     WHERE id = ? AND is_active = 1
     LIMIT 1`,
    [adminId]
  );

  return rows[0];
}

router.get("/", async (req, res, next) => {
  try {
    const admin = await findActiveAdmin(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin account was not found." });
    }

    return res.json({ admin: publicAdmin(admin) });
  } catch (error) {
    return next(error);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = req.body.phone === undefined ? undefined : String(req.body.phone || "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    await db.execute(
      `UPDATE admins
       SET name = ?, phone = ?
       WHERE id = ? AND is_active = 1`,
      [name, phone || null, req.admin.id]
    );

    const admin = await findActiveAdmin(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin account was not found." });
    }

    return res.json({
      message: "Profile updated successfully.",
      admin: publicAdmin(admin),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/password", async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const admin = await findActiveAdmin(req.admin.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin account was not found." });
    }

    const passwordMatches = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.execute("UPDATE admins SET password_hash = ? WHERE id = ?", [passwordHash, req.admin.id]);

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
