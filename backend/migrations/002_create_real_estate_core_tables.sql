CREATE TABLE IF NOT EXISTS properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  slug VARCHAR(220) NOT NULL,
  listing_code VARCHAR(60) NULL,
  status ENUM('draft', 'active', 'pending', 'sold', 'leased', 'archived') NOT NULL DEFAULT 'draft',
  property_type ENUM('apartment', 'house', 'townhome', 'condo', 'land', 'commercial', 'other') NOT NULL DEFAULT 'house',
  address_line_1 VARCHAR(180) NOT NULL,
  address_line_2 VARCHAR(180) NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(80) NOT NULL,
  postal_code VARCHAR(30) NULL,
  country VARCHAR(80) NOT NULL DEFAULT 'United States',
  price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  bedrooms DECIMAL(4,1) NULL,
  bathrooms DECIMAL(4,1) NULL,
  square_feet INT UNSIGNED NULL,
  lot_square_feet INT UNSIGNED NULL,
  year_built SMALLINT UNSIGNED NULL,
  description TEXT NULL,
  cover_image_url VARCHAR(500) NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_properties_slug (slug),
  UNIQUE KEY uq_properties_listing_code (listing_code),
  KEY idx_properties_status (status),
  KEY idx_properties_location (city, state),
  KEY idx_properties_price (price),
  CONSTRAINT fk_properties_created_by
    FOREIGN KEY (created_by) REFERENCES admins(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(180) NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_property_images_property (property_id),
  CONSTRAINT fk_property_images_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_features (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id BIGINT UNSIGNED NOT NULL,
  feature_name VARCHAR(120) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_property_features_property (property_id),
  KEY idx_property_features_name (feature_name),
  CONSTRAINT fk_property_features_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40) NULL,
  message TEXT NULL,
  source VARCHAR(80) NULL,
  status ENUM('new', 'contacted', 'qualified', 'closed', 'lost') NOT NULL DEFAULT 'new',
  property_id BIGINT UNSIGNED NULL,
  assigned_admin_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leads_status (status),
  KEY idx_leads_email (email),
  KEY idx_leads_property (property_id),
  CONSTRAINT fk_leads_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_leads_assigned_admin
    FOREIGN KEY (assigned_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
