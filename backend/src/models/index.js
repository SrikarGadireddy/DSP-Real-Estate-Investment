const db = require('../config/database');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT DEFAULT 'investor' CHECK(role IN ('investor', 'admin', 'agent')),
      phone TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      country TEXT DEFAULT 'US',
      property_type TEXT NOT NULL CHECK(property_type IN ('residential', 'commercial', 'industrial', 'land', 'mixed-use')),
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'under-contract', 'sold', 'off-market')),
      price REAL NOT NULL,
      bedrooms INTEGER,
      bathrooms REAL,
      square_feet INTEGER,
      lot_size REAL,
      year_built INTEGER,
      parking_spaces INTEGER,
      latitude REAL,
      longitude REAL,
      images TEXT DEFAULT '[]',
      features TEXT DEFAULT '[]',
      listed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      investment_amount REAL NOT NULL,
      ownership_percentage REAL,
      investment_date TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'pending')),
      expected_roi REAL,
      actual_roi REAL,
      monthly_income REAL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_value TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT DEFAULT '["read"]',
      rate_limit INTEGER DEFAULT 1000,
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_integrations (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      base_url TEXT NOT NULL,
      auth_type TEXT NOT NULL CHECK(auth_type IN ('api_key', 'oauth2', 'bearer')),
      documentation_url TEXT,
      category TEXT NOT NULL CHECK(category IN ('property_data', 'market_analysis', 'mortgage', 'demographics', 'mapping')),
      config_template TEXT DEFAULT '{}',
      is_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_integration_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      integration_id TEXT NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
      config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      last_sync_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, integration_id)
    );

    CREATE TABLE IF NOT EXISTS saved_searches (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      criteria TEXT DEFAULT '{}',
      notification_enabled INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS property_analytics (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      metric_type TEXT NOT NULL CHECK(metric_type IN ('page_view', 'inquiry', 'favorite')),
      user_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
    CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
    CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
    CREATE INDEX IF NOT EXISTS idx_investments_property ON investments(property_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_value ON api_keys(key_value);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_property_analytics_property ON property_analytics(property_id);
  `);

  seedApiIntegrations();
}

function seedApiIntegrations() {
  const count = db.prepare('SELECT COUNT(*) AS cnt FROM api_integrations').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(`
    INSERT INTO api_integrations (id, name, display_name, description, base_url, auth_type, documentation_url, category, config_template)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const { v4: uuidv4 } = require('uuid');

  const integrations = [
    {
      name: 'zillow_api',
      display_name: 'Zillow API',
      description: 'Access Zillow property data including Zestimates, property details, and comparable sales.',
      base_url: 'https://api.bridgedataoutput.com/api/v2',
      auth_type: 'api_key',
      documentation_url: 'https://www.zillow.com/howto/api/APIOverview.htm',
      category: 'property_data',
      config_template: JSON.stringify({ api_key: '', region: 'us' }),
    },
    {
      name: 'realtor_api',
      display_name: 'Realtor.com API',
      description: 'Access Realtor.com listings, property details, and market trends.',
      base_url: 'https://api.realtor.com/v2',
      auth_type: 'api_key',
      documentation_url: 'https://www.realtor.com/api',
      category: 'property_data',
      config_template: JSON.stringify({ api_key: '' }),
    },
    {
      name: 'walkscore_api',
      display_name: 'Walk Score API',
      description: 'Get Walk Score, Transit Score, and Bike Score for any location.',
      base_url: 'https://api.walkscore.com',
      auth_type: 'api_key',
      documentation_url: 'https://www.walkscore.com/professional/api.php',
      category: 'property_data',
      config_template: JSON.stringify({ api_key: '' }),
    },
    {
      name: 'google_maps_geocoding',
      display_name: 'Google Maps Geocoding API',
      description: 'Convert addresses to geographic coordinates and perform reverse geocoding.',
      base_url: 'https://maps.googleapis.com/maps/api/geocode',
      auth_type: 'api_key',
      documentation_url: 'https://developers.google.com/maps/documentation/geocoding',
      category: 'mapping',
      config_template: JSON.stringify({ api_key: '', output_format: 'json' }),
    },
    {
      name: 'census_bureau_api',
      display_name: 'Census Bureau API',
      description: 'Access US Census Bureau demographic and housing data for market analysis.',
      base_url: 'https://api.census.gov/data',
      auth_type: 'api_key',
      documentation_url: 'https://www.census.gov/data/developers.html',
      category: 'demographics',
      config_template: JSON.stringify({ api_key: '', dataset: 'acs/acs5' }),
    },
    {
      name: 'mortgage_rates_api',
      display_name: 'Mortgage Rates API',
      description: 'Get current mortgage rates and historical rate data for investment calculations.',
      base_url: 'https://api.fiscaldata.treasury.gov/services/api',
      auth_type: 'api_key',
      documentation_url: 'https://fiscaldata.treasury.gov/api-documentation/',
      category: 'mortgage',
      config_template: JSON.stringify({ api_key: '', rate_type: '30yr_fixed' }),
    },
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(
        uuidv4(),
        item.name,
        item.display_name,
        item.description,
        item.base_url,
        item.auth_type,
        item.documentation_url,
        item.category,
        item.config_template
      );
    }
  });

  insertMany(integrations);
}

module.exports = { initializeDatabase };
