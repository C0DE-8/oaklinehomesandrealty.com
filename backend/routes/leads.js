const express = require("express");

const db = require("../config/db");

const router = express.Router();

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function pick(body, ...keys) {
  for (const key of keys) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
      return body[key];
    }
  }

  return "";
}

function formatMoney(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return cleanString(value);
  }

  return `$${amount.toLocaleString()}`;
}

function nullableMoney(value) {
  const amount = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function nullableDate(value) {
  const cleaned = cleanString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

function leadPayload(body) {
  return {
    firstName: cleanString(pick(body, "firstName", "first_name", "first-name")),
    lastName: nullableString(pick(body, "lastName", "last_name", "last-name")),
    email: cleanString(pick(body, "email")).toLowerCase(),
    phone: nullableString(pick(body, "phone")),
    market: nullableString(pick(body, "market", "branchLabel", "branch_label")),
    branch: nullableString(pick(body, "branch")),
    bedrooms: nullableString(pick(body, "bedrooms")),
    extraRoom: pick(body, "extraRoom", "extra_room", "extra-room") ? 1 : 0,
    bathrooms: nullableString(pick(body, "bathrooms")),
    maxBudget: nullableMoney(pick(body, "maxBudget", "max_budget", "max-budget")),
    moveDate: nullableDate(pick(body, "moveDate", "move_date", "move-date")),
    leaseTerm: nullableString(pick(body, "leaseTerm", "lease_term", "lease-term")),
    credit: nullableString(pick(body, "credit")),
    background: nullableString(pick(body, "background")),
    instagram: nullableString(pick(body, "instagram")),
    referral: nullableString(pick(body, "referral")),
    featureRequests: nullableString(pick(body, "featureRequests", "feature_requests", "feature-requests")),
    pageUrl: nullableString(pick(body, "pageUrl", "page_url", "page-url")),
    utmSource: nullableString(pick(body, "utmSource", "utm_source")),
    utmMedium: nullableString(pick(body, "utmMedium", "utm_medium")),
    utmCampaign: nullableString(pick(body, "utmCampaign", "utm_campaign")),
  };
}

function leadMessage(body) {
  const lines = [
    ["Market", pick(body, "market", "branchLabel", "branch_label", "branch")],
    ["Bedrooms", pick(body, "bedrooms")],
    ["Extra room", pick(body, "extraRoom", "extra_room", "extra-room") ? "Yes" : "No"],
    ["Bathrooms", pick(body, "bathrooms")],
    ["Max budget", formatMoney(pick(body, "maxBudget", "max_budget", "max-budget"))],
    ["Move date", pick(body, "moveDate", "move_date", "move-date")],
    ["Lease term", pick(body, "leaseTerm", "lease_term", "lease-term")],
    ["Credit", pick(body, "credit")],
    ["Background", pick(body, "background")],
    ["Instagram", pick(body, "instagram")],
    ["Referral", pick(body, "referral")],
    ["Feature requests", pick(body, "featureRequests", "feature_requests", "feature-requests")],
    ["Page URL", pick(body, "pageUrl", "page_url", "page-url")],
    ["UTM Source", pick(body, "utmSource", "utm_source")],
    ["UTM Medium", pick(body, "utmMedium", "utm_medium")],
    ["UTM Campaign", pick(body, "utmCampaign", "utm_campaign")],
  ];

  return lines
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

router.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    const payload = leadPayload(body);

    if (!payload.firstName || !payload.email || !payload.phone) {
      return res.status(400).json({ message: "First name, phone, and email are required." });
    }

    const [result] = await db.execute(
      `INSERT INTO leads
       (first_name, last_name, email, phone, market, branch, bedrooms, extra_room,
        bathrooms, max_budget, move_date, lease_term, credit, background, instagram,
        referral, feature_requests, page_url, utm_source, utm_medium, utm_campaign,
        message, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.firstName,
        payload.lastName,
        payload.email,
        payload.phone,
        payload.market,
        payload.branch,
        payload.bedrooms,
        payload.extraRoom,
        payload.bathrooms,
        payload.maxBudget,
        payload.moveDate,
        payload.leaseTerm,
        payload.credit,
        payload.background,
        payload.instagram,
        payload.referral,
        payload.featureRequests,
        payload.pageUrl,
        payload.utmSource,
        payload.utmMedium,
        payload.utmCampaign,
        leadMessage(body),
        "get-started",
      ]
    );

    return res.status(201).json({
      message: "Thanks, our team is on it!",
      lead: {
        id: result.insertId,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        source: "get-started",
        status: "new",
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
