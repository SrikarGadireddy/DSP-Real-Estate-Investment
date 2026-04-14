const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: List available API integrations
 *     tags: [API Integrations]
 *     security: []
 *     responses:
 *       200:
 *         description: List of API integrations
 */
router.get('/', (req, res, next) => {
  try {
    const integrations = db.prepare('SELECT * FROM api_integrations WHERE is_enabled = 1 ORDER BY category, display_name').all();
    res.json({ integrations });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   get:
 *     summary: Get integration details
 *     tags: [API Integrations]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Integration details
 *       404:
 *         description: Integration not found
 */
router.get('/:id', (req, res, next) => {
  try {
    const integration = db.prepare('SELECT * FROM api_integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found.' });
    }
    res.json({ integration });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/integrations/{id}/connect:
 *   post:
 *     summary: Connect to an integration
 *     tags: [API Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config: { type: object }
 *     responses:
 *       201:
 *         description: Connection created
 */
router.post('/:id/connect', authenticate, (req, res, next) => {
  try {
    const integration = db.prepare('SELECT * FROM api_integrations WHERE id = ?').get(req.params.id);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found.' });
    }

    const existing = db.prepare('SELECT * FROM api_integration_connections WHERE user_id = ? AND integration_id = ?').get(req.user.id, req.params.id);
    if (existing) {
      db.prepare("UPDATE api_integration_connections SET config = ?, is_active = 1, updated_at = datetime('now') WHERE id = ?")
        .run(JSON.stringify(req.body.config || {}), existing.id);
      const updated = db.prepare('SELECT * FROM api_integration_connections WHERE id = ?').get(existing.id);
      return res.json({ connection: updated, message: 'Connection updated.' });
    }

    const id = generateId();
    db.prepare(`
      INSERT INTO api_integration_connections (id, user_id, integration_id, config)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, req.params.id, JSON.stringify(req.body.config || {}));

    const connection = db.prepare('SELECT * FROM api_integration_connections WHERE id = ?').get(id);
    res.status(201).json({ connection });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/integrations/{id}/disconnect:
 *   post:
 *     summary: Disconnect from an integration
 *     tags: [API Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Disconnected
 */
router.post('/:id/disconnect', authenticate, (req, res, next) => {
  try {
    const connection = db.prepare('SELECT * FROM api_integration_connections WHERE user_id = ? AND integration_id = ?').get(req.user.id, req.params.id);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found.' });
    }

    db.prepare("UPDATE api_integration_connections SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(connection.id);
    res.json({ message: 'Disconnected successfully.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/integrations/connections/me:
 *   get:
 *     summary: Get user integration connections
 *     tags: [API Integrations]
 *     responses:
 *       200:
 *         description: User connections
 */
router.get('/connections/me', authenticate, (req, res, next) => {
  try {
    const connections = db.prepare(`
      SELECT c.*, ai.name AS integration_name, ai.display_name, ai.category
      FROM api_integration_connections c
      JOIN api_integrations ai ON c.integration_id = ai.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json({ connections });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
