const express = require('express');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { apiKeyValidation, validate } = require('../middleware/validators');
const { generateId } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/keys:
 *   get:
 *     summary: List user API keys
 *     tags: [API Keys]
 *     responses:
 *       200:
 *         description: List of API keys
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const keys = db.prepare('SELECT id, name, description, permissions, rate_limit, is_active, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ keys });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/keys:
 *   post:
 *     summary: Create a new API key
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               permissions: { type: array, items: { type: string } }
 *               expires_in_days: { type: integer }
 *     responses:
 *       201:
 *         description: API key created (key_value is shown only once)
 */
router.post('/', authenticate, apiKeyValidation, validate, (req, res, next) => {
  try {
    const { name, description, permissions, expires_in_days } = req.body;
    const id = generateId();
    const key_value = `dsp_${crypto.randomBytes(32).toString('hex')}`;

    let expires_at = null;
    if (expires_in_days) {
      const d = new Date();
      d.setDate(d.getDate() + expires_in_days);
      expires_at = d.toISOString();
    }

    db.prepare(`
      INSERT INTO api_keys (id, user_id, key_value, name, description, permissions, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, key_value, name, description || null, JSON.stringify(permissions || ['read']), expires_at);

    res.status(201).json({
      key: { id, name, key_value, permissions: permissions || ['read'], expires_at, created_at: new Date().toISOString() },
      message: 'Store this key securely. It will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: API key revoked
 *       404:
 *         description: API key not found
 */
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const key = db.prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!key) {
      return res.status(404).json({ error: 'API key not found.' });
    }

    db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
    res.json({ message: 'API key revoked successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
