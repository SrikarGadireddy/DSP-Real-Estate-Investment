const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generateId, paginate } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search properties
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search keyword
 *       - in: query
 *         name: city
 *         schema: { type: string }
 *       - in: query
 *         name: state
 *         schema: { type: string }
 *       - in: query
 *         name: property_type
 *         schema: { type: string }
 *       - in: query
 *         name: min_price
 *         schema: { type: number }
 *       - in: query
 *         name: max_price
 *         schema: { type: number }
 *       - in: query
 *         name: bedrooms
 *         schema: { type: integer }
 *       - in: query
 *         name: bathrooms
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { page: p, limit: l, offset } = paginate(req.query.page, req.query.limit);
    const conditions = [];
    const params = [];

    if (req.query.q) {
      conditions.push('(title LIKE ? OR description LIKE ? OR address LIKE ? OR city LIKE ?)');
      const q = `%${req.query.q}%`;
      params.push(q, q, q, q);
    }
    if (req.query.city) {
      conditions.push('city LIKE ?');
      params.push(`%${req.query.city}%`);
    }
    if (req.query.state) {
      conditions.push('state = ?');
      params.push(req.query.state);
    }
    if (req.query.property_type) {
      conditions.push('property_type = ?');
      params.push(req.query.property_type);
    }
    if (req.query.min_price) {
      conditions.push('price >= ?');
      params.push(parseFloat(req.query.min_price));
    }
    if (req.query.max_price) {
      conditions.push('price <= ?');
      params.push(parseFloat(req.query.max_price));
    }
    if (req.query.bedrooms) {
      conditions.push('bedrooms >= ?');
      params.push(parseInt(req.query.bedrooms, 10));
    }
    if (req.query.bathrooms) {
      conditions.push('bathrooms >= ?');
      params.push(parseFloat(req.query.bathrooms));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) AS count FROM properties ${where}`).get(...params).count;
    const properties = db.prepare(`SELECT * FROM properties ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, l, offset);

    res.json({ properties, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/search/saved:
 *   get:
 *     summary: Get saved searches
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: List of saved searches
 */
router.get('/saved', authenticate, (req, res, next) => {
  try {
    const searches = db.prepare('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json({ searches });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/search/saved:
 *   post:
 *     summary: Save a search
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, criteria]
 *             properties:
 *               name: { type: string }
 *               criteria: { type: object }
 *               notification_enabled: { type: boolean }
 *     responses:
 *       201:
 *         description: Search saved
 */
router.post('/saved', authenticate, (req, res, next) => {
  try {
    const { name, criteria, notification_enabled } = req.body;
    if (!name || !criteria) {
      return res.status(400).json({ error: 'Name and criteria are required.' });
    }

    const id = generateId();
    db.prepare(`
      INSERT INTO saved_searches (id, user_id, name, criteria, notification_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.id, name, JSON.stringify(criteria), notification_enabled ? 1 : 0);

    const search = db.prepare('SELECT * FROM saved_searches WHERE id = ?').get(id);
    res.status(201).json({ search });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/search/saved/{id}:
 *   delete:
 *     summary: Delete a saved search
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Saved search deleted
 */
router.delete('/saved/:id', authenticate, (req, res, next) => {
  try {
    const search = db.prepare('SELECT * FROM saved_searches WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!search) {
      return res.status(404).json({ error: 'Saved search not found.' });
    }

    db.prepare('DELETE FROM saved_searches WHERE id = ?').run(req.params.id);
    res.json({ message: 'Saved search deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
