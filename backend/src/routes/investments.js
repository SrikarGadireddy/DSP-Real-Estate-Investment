const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { investmentValidation, validate } = require('../middleware/validators');
const { generateId, paginate } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/investments:
 *   get:
 *     summary: List user investments
 *     tags: [Investments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of investments
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const { page: p, limit: l, offset } = paginate(req.query.page, req.query.limit);
    const total = db.prepare('SELECT COUNT(*) AS count FROM investments WHERE user_id = ?').get(req.user.id).count;
    const investments = db.prepare(`
      SELECT i.*, p.title AS property_title, p.address, p.city, p.state, p.price AS property_price
      FROM investments i
      LEFT JOIN properties p ON i.property_id = p.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, l, offset);

    res.json({ investments, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/investments/{id}:
 *   get:
 *     summary: Get investment by ID
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Investment details
 *       404:
 *         description: Investment not found
 */
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const investment = db.prepare(`
      SELECT i.*, p.title AS property_title, p.address, p.city, p.state, p.price AS property_price
      FROM investments i
      LEFT JOIN properties p ON i.property_id = p.id
      WHERE i.id = ? AND i.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found.' });
    }
    res.json({ investment });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/investments:
 *   post:
 *     summary: Create a new investment
 *     tags: [Investments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [property_id, investment_amount]
 *     responses:
 *       201:
 *         description: Investment created
 */
router.post('/', authenticate, investmentValidation, validate, (req, res, next) => {
  try {
    const { property_id, investment_amount, ownership_percentage, expected_roi, monthly_income, notes } = req.body;

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(property_id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const id = generateId();
    db.prepare(`
      INSERT INTO investments (id, user_id, property_id, investment_amount, ownership_percentage, expected_roi, monthly_income, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, property_id, investment_amount, ownership_percentage || null, expected_roi || null, monthly_income || null, notes || null);

    const investment = db.prepare('SELECT * FROM investments WHERE id = ?').get(id);
    res.status(201).json({ investment });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/investments/{id}:
 *   put:
 *     summary: Update an investment
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Investment updated
 */
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const investment = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found.' });
    }

    const fields = ['investment_amount', 'ownership_percentage', 'status', 'expected_roi', 'actual_roi', 'monthly_income', 'notes'];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE investments SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM investments WHERE id = ?').get(req.params.id);
    res.json({ investment: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/investments/{id}:
 *   delete:
 *     summary: Delete an investment
 *     tags: [Investments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Investment deleted
 */
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const investment = db.prepare('SELECT * FROM investments WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!investment) {
      return res.status(404).json({ error: 'Investment not found.' });
    }

    db.prepare('DELETE FROM investments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Investment deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
