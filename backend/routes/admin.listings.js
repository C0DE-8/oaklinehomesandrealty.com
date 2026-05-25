const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadRoot = path.join(__dirname, "..", "uploads", "listings");

const allowedStatuses = new Set(["draft", "active", "pending", "sold", "leased", "archived"]);
const allowedTypes = new Set(["apartment", "house", "townhome", "condo", "land", "commercial", "other"]);
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
    fileSize: 6 * 1024 * 1024,
    files: 16,
  },
  fileFilter(req, file, cb) {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, WebP, and GIF images can be uploaded."));
    }

    return cb(null, true);
  },
});

const listingUpload = upload.fields([
  { name: "cover_image_file", maxCount: 1 },
  { name: "gallery_images", maxCount: 15 },
]);

function handleListingUpload(req, res, next) {
  listingUpload(req, res, (error) => {
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

function uploadedImageUrl(file) {
  return file ? `/uploads/listings/${file.filename}` : null;
}

function uploadedFiles(req, field) {
  return req.files && Array.isArray(req.files[field]) ? req.files[field] : [];
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

  const listing = rows[0] || null;

  if (!listing) {
    return null;
  }

  listing.images = await readListingImages(id);
  return listing;
}

async function readListingImages(propertyId) {
  const [rows] = await db.execute(
    `SELECT id, property_id, image_url, alt_text, sort_order, is_primary, created_at
       FROM property_images
      WHERE property_id = ?
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    [propertyId]
  );

  return rows;
}

async function attachListingImages(listings) {
  if (!listings.length) {
    return listings;
  }

  const ids = listings.map((listing) => listing.id);
  const placeholders = ids.map(() => "?").join(",");
  const [images] = await db.execute(
    `SELECT id, property_id, image_url, alt_text, sort_order, is_primary, created_at
       FROM property_images
      WHERE property_id IN (${placeholders})
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    ids
  );
  const imagesByListing = new Map();

  images.forEach((image) => {
    const list = imagesByListing.get(image.property_id) || [];
    list.push(image);
    imagesByListing.set(image.property_id, list);
  });

  return listings.map((listing) => ({
    ...listing,
    images: imagesByListing.get(listing.id) || [],
  }));
}

async function addGalleryImages(propertyId, files, startSortOrder = 0) {
  for (const [index, file] of files.entries()) {
    await db.execute(
      `INSERT INTO property_images (property_id, image_url, alt_text, sort_order, is_primary)
       VALUES (?, ?, ?, ?, 0)`,
      [propertyId, uploadedImageUrl(file), file.originalname || null, startSortOrder + index]
    );
  }
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

    return res.json({ listings: await attachListingImages(rows) });
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

router.post("/", handleListingUpload, async (req, res, next) => {
  try {
    const payload = listingPayload(req.body, req.admin.id);
    const coverImage = uploadedFiles(req, "cover_image_file")[0];
    const galleryImages = uploadedFiles(req, "gallery_images");

    if (coverImage) {
      payload.cover_image_url = uploadedImageUrl(coverImage);
    }

    const [result] = await db.execute(
      `INSERT INTO properties
       (title, slug, listing_code, status, property_type, address_line_1,
        address_line_2, city, state, postal_code, country, price, bedrooms,
        bathrooms, square_feet, lot_square_feet, year_built, description,
        cover_image_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(payload)
    );

    await addGalleryImages(result.insertId, galleryImages);

    const listing = await readListing(result.insertId);
    return res.status(201).json({ message: "Listing created.", listing });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Listing slug or code already exists." });
    }
    return next(error);
  }
});

router.patch("/:id", handleListingUpload, async (req, res, next) => {
  try {
    const existing = await readListing(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const payload = listingPayload({ ...existing, ...req.body }, existing.created_by || req.admin.id);
    const coverImage = uploadedFiles(req, "cover_image_file")[0];
    const galleryImages = uploadedFiles(req, "gallery_images");

    if (coverImage) {
      payload.cover_image_url = uploadedImageUrl(coverImage);
    }

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

    await addGalleryImages(req.params.id, galleryImages, existing.images.length);

    const listing = await readListing(req.params.id);
    return res.json({ message: "Listing updated.", listing });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Listing slug or code already exists." });
    }
    return next(error);
  }
});

router.delete("/:id/images/:imageId", async (req, res, next) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM property_images WHERE id = ? AND property_id = ?",
      [req.params.imageId, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Listing image not found." });
    }

    return res.json({ message: "Listing image deleted." });
  } catch (error) {
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
