const db = require('../config/database');

function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required. Provide X-API-Key header.' });
    }

    const keyRecord = db.prepare(`
      SELECT ak.*, u.email, u.first_name, u.last_name, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_value = ?
    `).get(apiKey);

    if (!keyRecord) {
      return res.status(401).json({ error: 'Invalid API key.' });
    }

    if (!keyRecord.is_active) {
      return res.status(403).json({ error: 'API key is inactive.' });
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return res.status(403).json({ error: 'API key has expired.' });
    }

    db.prepare('UPDATE api_keys SET last_used_at = datetime(?) WHERE id = ?')
      .run(new Date().toISOString(), keyRecord.id);

    req.apiKey = {
      id: keyRecord.id,
      name: keyRecord.name,
      permissions: JSON.parse(keyRecord.permissions || '["read"]'),
      rate_limit: keyRecord.rate_limit,
    };
    req.user = {
      id: keyRecord.user_id,
      email: keyRecord.email,
      first_name: keyRecord.first_name,
      last_name: keyRecord.last_name,
      role: keyRecord.role,
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'API key authentication failed.' });
  }
}

module.exports = { apiKeyAuth };
