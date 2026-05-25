const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadRoot = path.join(__dirname, "..", "uploads", "agents");
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadRoot);
    },
    filename(req, file, cb) {
      const extension = path.extname(file.originalname || "").toLowerCase();
      const safeExtension = extension && extension.length <= 8 ? extension : ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`);
    },
  }),
  limits: {
    fileSize: 4 * 1024 * 1024,
    files: 1,
  },
  fileFilter(req, file, cb) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP, and GIF images can be uploaded."));
    }

    return cb(null, true);
  },
});

function handleAgentUpload(req, res, next) {
  upload.single("photo_file")(req, res, (error) => {
    if (error) {
      error.statusCode = 400;
      return next(error);
    }

    return next();
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function uploadedPhotoUrl(file) {
  return file ? `/uploads/agents/${file.filename}` : null;
}

function agentPayload(body, adminId, file) {
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();

  if (!name || !email) {
    const error = new Error("Agent name and email are required.");
    error.statusCode = 400;
    throw error;
  }

  return {
    name,
    email,
    phone: nullableString(body.phone),
    market: nullableString(body.market),
    title: nullableString(body.title),
    bio: nullableString(body.bio),
    photo_url: uploadedPhotoUrl(file) || nullableString(body.photo_url || body.photoUrl),
    is_active: body.is_active === false || body.is_active === "0" ? 0 : 1,
    created_by: adminId,
  };
}

async function readAgent(id) {
  const [rows] = await db.execute(
    `SELECT id, name, email, phone, market, title, bio, photo_url, is_active,
            created_by, created_at, updated_at
       FROM agents
      WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

router.use(requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, name, email, phone, market, title, photo_url, is_active, updated_at
         FROM agents
        ORDER BY updated_at DESC
        LIMIT 200`
    );

    return res.json({ agents: rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", handleAgentUpload, async (req, res, next) => {
  try {
    const payload = agentPayload(req.body, req.admin.id, req.file);

    const [result] = await db.execute(
      `INSERT INTO agents
       (name, email, phone, market, title, bio, photo_url, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(payload)
    );

    const agent = await readAgent(result.insertId);
    return res.status(201).json({ message: "Agent created.", agent });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An agent with this email already exists." });
    }
    return next(error);
  }
});

router.patch("/:id", handleAgentUpload, async (req, res, next) => {
  try {
    const existing = await readAgent(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Agent not found." });
    }

    const payload = agentPayload({ ...existing, ...req.body }, existing.created_by || req.admin.id, req.file);

    await db.execute(
      `UPDATE agents
          SET name = ?, email = ?, phone = ?, market = ?, title = ?, bio = ?,
              photo_url = ?, is_active = ?
        WHERE id = ?`,
      [
        payload.name,
        payload.email,
        payload.phone,
        payload.market,
        payload.title,
        payload.bio,
        payload.photo_url,
        payload.is_active,
        req.params.id,
      ]
    );

    const agent = await readAgent(req.params.id);
    return res.json({ message: "Agent updated.", agent });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "An agent with this email already exists." });
    }
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.execute("DELETE FROM agents WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Agent not found." });
    }

    return res.json({ message: "Agent deleted." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
