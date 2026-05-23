const express = require("express");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

const allowedStatuses = new Set(["draft", "active", "pending", "sold", "leased", "archived"]);
const allowedTypes = new Set(["apartment", "house", "townhome", "condo", "land", "commercial", "other"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function listingPayload(body, adminId) {
  const title = cleanString(body.title);
  const city = cleanString(body.city);
  const state = cleanString(body.state);
  const address = cleanString(body.address_line_1 || body.addressLine1);

  if (!title || !city || !state || !address) {
    const error = new Error("Title, address, city, and state are required.");
    error.statusCode = 400;
    throw error;
  }

  const status = allowedStatuses.has(body.status) ? body.status : "draft";
  const propertyType = allowedTypes.has(body.property_type || body.propertyType)
    ? body.property_type || body.propertyType
    : "apartment";

  return {
    title,
    slug: slugify(body.slug || title),
    listing_code: nullableString(body.listing_code || body.listingCode),
    status,
    property_type: propertyType,
    address_line_1: address,
    address_line_2: nullableString(body.address_line_2 || body.addressLine2),
    city,
    state,
    postal_code: nullableString(body.postal_code || body.postalCode),
    country: nullableString(body.country) || "United States",
    price: nullableNumber(body.price) || 0,
    bedrooms: nullableNumber(body.bedrooms),
    bathrooms: nullableNumber(body.bathrooms),
    square_feet: nullableNumber(body.square_feet || body.squareFeet),
    lot_square_feet: nullableNumber(body.lot_square_feet || body.lotSquareFeet),
    year_built: nullableNumber(body.year_built || body.yearBuilt),
    description: nullableString(body.description),
    cover_image_url: nullableString(body.cover_image_url || body.coverImageUrl),
    created_by: adminId,
  };
}

async function readListing(id) {
  const [rows] = await db.execute(
    `SELECT id, title, slug, listing_code, status, property_type, address_line_1,
            address_line_2, city, state, postal_code, country, price, bedrooms,
            bathrooms, square_feet, lot_square_feet, year_built, description,
            cover_image_url, created_by, created_at, updated_at
       FROM properties
      WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

router.use(requireAdmin);

router.get("/", async (req, res, next) => {
  try {
    const status = allowedStatuses.has(req.query.status) ? req.query.status : null;
    const search = cleanString(req.query.search);
    const params = [];
    const where = [];

    if (status) {
      where.push("status = ?");
      params.push(status);
    }

    if (search) {
      where.push("(title LIKE ? OR city LIKE ? OR state LIKE ? OR listing_code LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await db.execute(
      `SELECT id, title, slug, listing_code, status, property_type, address_line_1,
              address_line_2, city, state, postal_code, country, price, bedrooms,
              bathrooms, square_feet, lot_square_feet, year_built, description,
              cover_image_url, updated_at
         FROM properties
        ${whereSql}
        ORDER BY updated_at DESC
        LIMIT 200`,
      params
    );

    return res.json({ listings: rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/stats/summary", async (req, res, next) => {
  try {
    const [[properties]] = await db.query(
      `SELECT
         COUNT(*) AS totalListings,
         SUM(status = 'active') AS activeListings,
         SUM(status = 'draft') AS draftListings
       FROM properties`
    );
    const [[leads]] = await db.query("SELECT COUNT(*) AS newLeads FROM leads WHERE status = 'new'");
    const [[users]] = await db.query("SELECT COUNT(*) AS savedUsers FROM users");

    return res.json({
      stats: {
        totalListings: Number(properties.totalListings || 0),
        activeListings: Number(properties.activeListings || 0),
        draftListings: Number(properties.draftListings || 0),
        newLeads: Number(leads.newLeads || 0),
        savedUsers: Number(users.savedUsers || 0),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const listing = await readListing(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    return res.json({ listing });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const payload = listingPayload(req.body, req.admin.id);

    const [result] = await db.execute(
      `INSERT INTO properties
       (title, slug, listing_code, status, property_type, address_line_1,
        address_line_2, city, state, postal_code, country, price, bedrooms,
        bathrooms, square_feet, lot_square_feet, year_built, description,
        cover_image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(payload)
    );

    const listing = await readListing(result.insertId);
    return res.status(201).json({ message: "Listing created.", listing });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Listing slug or code already exists." });
    }
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const existing = await readListing(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const payload = listingPayload({ ...existing, ...req.body }, existing.created_by || req.admin.id);

    await db.execute(
      `UPDATE properties
          SET title = ?, slug = ?, listing_code = ?, status = ?, property_type = ?,
              address_line_1 = ?, address_line_2 = ?, city = ?, state = ?,
              postal_code = ?, country = ?, price = ?, bedrooms = ?, bathrooms = ?,
              square_feet = ?, lot_square_feet = ?, year_built = ?,
              description = ?, cover_image_url = ?
        WHERE id = ?`,
      [
        payload.title,
        payload.slug,
        payload.listing_code,
        payload.status,
        payload.property_type,
        payload.address_line_1,
        payload.address_line_2,
        payload.city,
        payload.state,
        payload.postal_code,
        payload.country,
        payload.price,
        payload.bedrooms,
        payload.bathrooms,
        payload.square_feet,
        payload.lot_square_feet,
        payload.year_built,
        payload.description,
        payload.cover_image_url,
        req.params.id,
      ]
    );

    const listing = await readListing(req.params.id);
    return res.json({ message: "Listing updated.", listing });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Listing slug or code already exists." });
    }
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [result] = await db.execute("DELETE FROM properties WHERE id = ?", [req.params.id]);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Listing not found." });
    }

    return res.json({ message: "Listing deleted." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
