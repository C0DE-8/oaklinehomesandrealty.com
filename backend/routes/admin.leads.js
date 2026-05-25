const express = require("express");

const db = require("../config/db");
const { requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();
const leadStatuses = new Set(["new", "contacted", "qualified", "closed", "lost"]);

router.use(requireAdmin);

function nullableId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const leadSelect = `SELECT leads.id, leads.first_name, leads.last_name, leads.email, leads.phone,
                           leads.market, leads.branch, leads.bedrooms, leads.extra_room,
                           leads.bathrooms, leads.max_budget, leads.move_date, leads.lease_term,
                           leads.credit, leads.background, leads.instagram, leads.referral,
                           leads.feature_requests, leads.page_url, leads.utm_source,
                           leads.utm_medium, leads.utm_campaign, leads.message, leads.source,
                           leads.status, leads.property_id, leads.assigned_agent_id,
                           agents.name AS assigned_agent_name,
                           properties.title AS property_title,
                           properties.slug AS property_slug,
                           properties.listing_code AS property_listing_code,
                           properties.city AS property_city,
                           properties.state AS property_state,
                           leads.created_at, leads.updated_at
                      FROM leads
                 LEFT JOIN agents ON agents.id = leads.assigned_agent_id
                 LEFT JOIN properties ON properties.id = leads.property_id`;

router.get("/", async (req, res, next) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const params = [];
    let where = "";

    if (status && leadStatuses.has(status)) {
      where = "WHERE leads.status = ?";
      params.push(status);
    }

    const [rows] = await db.execute(
      `${leadSelect}
        ${where}
        ORDER BY leads.created_at DESC
        LIMIT 300`,
      params
    );

    return res.json({ leads: rows });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const status = typeof req.body.status === "string" ? req.body.status.trim() : "";
    const assignedAgentId = nullableId(req.body.assigned_agent_id || req.body.assignedAgentId);

    if (!leadStatuses.has(status)) {
      return res.status(400).json({ message: "A valid lead status is required." });
    }

    if (assignedAgentId) {
      const [agents] = await db.execute("SELECT id FROM agents WHERE id = ?", [assignedAgentId]);

      if (!agents.length) {
        return res.status(400).json({ message: "Assigned agent was not found." });
      }
    }

    const [result] = await db.execute(
      "UPDATE leads SET status = ?, assigned_agent_id = ? WHERE id = ?",
      [status, assignedAgentId, req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Lead not found." });
    }

    const [rows] = await db.execute(`${leadSelect} WHERE leads.id = ?`, [req.params.id]);

    return res.json({ message: "Lead updated.", lead: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
