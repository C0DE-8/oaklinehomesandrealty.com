ALTER TABLE leads
  ADD COLUMN market VARCHAR(120) NULL AFTER phone,
  ADD COLUMN branch VARCHAR(40) NULL AFTER market,
  ADD COLUMN bedrooms VARCHAR(20) NULL AFTER branch,
  ADD COLUMN extra_room TINYINT(1) NOT NULL DEFAULT 0 AFTER bedrooms,
  ADD COLUMN bathrooms VARCHAR(20) NULL AFTER extra_room,
  ADD COLUMN max_budget DECIMAL(12,2) NULL AFTER bathrooms,
  ADD COLUMN move_date DATE NULL AFTER max_budget,
  ADD COLUMN lease_term VARCHAR(40) NULL AFTER move_date,
  ADD COLUMN credit VARCHAR(80) NULL AFTER lease_term,
  ADD COLUMN background VARCHAR(120) NULL AFTER credit,
  ADD COLUMN instagram VARCHAR(120) NULL AFTER background,
  ADD COLUMN referral VARCHAR(120) NULL AFTER instagram,
  ADD COLUMN feature_requests TEXT NULL AFTER referral,
  ADD COLUMN page_url VARCHAR(500) NULL AFTER feature_requests,
  ADD COLUMN utm_source VARCHAR(120) NULL AFTER page_url,
  ADD COLUMN utm_medium VARCHAR(120) NULL AFTER utm_source,
  ADD COLUMN utm_campaign VARCHAR(180) NULL AFTER utm_medium,
  ADD COLUMN assigned_agent_id BIGINT UNSIGNED NULL AFTER property_id;

ALTER TABLE leads
  DROP FOREIGN KEY fk_leads_assigned_admin;

ALTER TABLE leads
  DROP INDEX fk_leads_assigned_admin,
  DROP COLUMN assigned_admin_id,
  ADD KEY idx_leads_assigned_agent (assigned_agent_id),
  ADD CONSTRAINT fk_leads_assigned_agent
    FOREIGN KEY (assigned_agent_id) REFERENCES agents(id)
    ON DELETE SET NULL;
