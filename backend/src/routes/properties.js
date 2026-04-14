const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { propertyValidation, validate } = require('../middleware/validators');
const { generateId, paginate } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: List all properties
 *     tags: [Properties]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: property_type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of properties
 */
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const { page: p, limit: l, offset } = paginate(req.query.page, req.query.limit);
    const conditions = [];
    const params = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }
    if (req.query.property_type) {
      conditions.push('property_type = ?');
      params.push(req.query.property_type);
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
 * /api/properties/{id}:
 *   get:
 *     summary: Get a property by ID
 *     tags: [Properties]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 */
router.get('/:id', optionalAuth, (req, res, next) => {
  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    res.json({ property });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, price, address, city, state, zip_code, property_type]
 *     responses:
 *       201:
 *         description: Property created
 *       401:
 *         description: Not authenticated
 */
router.post('/', authenticate, propertyValidation, validate, (req, res, next) => {
  try {
    const id = generateId();
    const {
      title, description, address, city, state, zip_code, country,
      property_type, status, price, bedrooms, bathrooms, square_feet,
      lot_size, year_built, parking_spaces, latitude, longitude,
      images, features,
    } = req.body;

    db.prepare(`
      INSERT INTO properties (id, title, description, address, city, state, zip_code, country,
        property_type, status, price, bedrooms, bathrooms, square_feet, lot_size, year_built,
        parking_spaces, latitude, longitude, images, features, listed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, title, description || null, address, city, state, zip_code,
      country || 'US', property_type, status || 'available', price,
      bedrooms || null, bathrooms || null, square_feet || null,
      lot_size || null, year_built || null, parking_spaces || null,
      latitude || null, longitude || null,
      JSON.stringify(images || []), JSON.stringify(features || []),
      req.user.id
    );

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
    res.status(201).json({ property });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property updated
 *       404:
 *         description: Property not found
 */
router.put('/:id', authenticate, (req, res, next) => {
  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (property.listed_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this property.' });
    }

    const fields = [
      'title', 'description', 'address', 'city', 'state', 'zip_code', 'country',
      'property_type', 'status', 'price', 'bedrooms', 'bathrooms', 'square_feet',
      'lot_size', 'year_built', 'parking_spaces', 'latitude', 'longitude',
    ];
    const updates = [];
    const params = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }
    if (req.body.images !== undefined) {
      updates.push('images = ?');
      params.push(JSON.stringify(req.body.images));
    }
    if (req.body.features !== undefined) {
      updates.push('features = ?');
      params.push(JSON.stringify(req.body.features));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id);

    db.prepare(`UPDATE properties SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    res.json({ property: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/properties/{id}:
 *   delete:
 *     summary: Delete a property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Property deleted
 *       404:
 *         description: Property not found
 */
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found.' });
    }
    if (property.listed_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this property.' });
    }

    db.prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
    res.json({ message: 'Property deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
