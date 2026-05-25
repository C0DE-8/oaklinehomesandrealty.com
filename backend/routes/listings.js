const express = require("express");

const db = require("../config/db");

const router = express.Router();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
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

router.get("/", async (req, res, next) => {
  try {
    const search = cleanString(req.query.search);
    const market = cleanString(req.query.market);
    const params = [];
    const where = ["status = 'active'"];

    if (search) {
      where.push("(title LIKE ? OR city LIKE ? OR state LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (market && market !== "United States") {
      where.push("(city LIKE ? OR state LIKE ?)");
      params.push(`%${market}%`, `%${market}%`);
    }

    const [rows] = await db.execute(
      `SELECT id, title, slug, listing_code, property_type, address_line_1,
              city, state, postal_code, country, price, bedrooms, bathrooms,
              square_feet, description, cover_image_url, updated_at
         FROM properties
        WHERE ${where.join(" AND ")}
        ORDER BY updated_at DESC
        LIMIT 200`,
      params
    );

    return res.json({ listings: await attachListingImages(rows) });
  } catch (error) {
    return next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, title, slug, listing_code, property_type, address_line_1,
              address_line_2, city, state, postal_code, country, price,
              bedrooms, bathrooms, square_feet, lot_square_feet, year_built,
              description, cover_image_url, updated_at
         FROM properties
        WHERE slug = ? AND status = 'active'
        LIMIT 1`,
      [req.params.slug]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const listing = rows[0];
    listing.images = await readListingImages(listing.id);

    return res.json({ listing });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
