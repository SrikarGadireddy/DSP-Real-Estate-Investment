const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateId } = require('../utils/helpers');
const { getOpenAIClient, isAIEnabled } = require('../utils/openai');

const router = express.Router();

// Configure multer — store PDFs in the uploads directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  },
});

/**
 * @swagger
 * /api/brochures:
 *   get:
 *     summary: List brochures uploaded by the current user
 *     tags: [Brochures]
 *     responses:
 *       200:
 *         description: List of brochures
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const brochures = db
      .prepare('SELECT * FROM brochures WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);

    const parsed = brochures.map((b) => ({
      ...b,
      extracted_data: safeJson(b.extracted_data, {}),
    }));

    res.json({ brochures: parsed });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/brochures/{id}:
 *   get:
 *     summary: Get a single brochure record
 *     tags: [Brochures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brochure details
 *       404:
 *         description: Brochure not found
 */
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const brochure = db
      .prepare('SELECT * FROM brochures WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!brochure) {
      return res.status(404).json({ error: 'Brochure not found.' });
    }

    res.json({
      brochure: { ...brochure, extracted_data: safeJson(brochure.extracted_data, {}) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/brochures/upload:
 *   post:
 *     summary: Upload a PDF brochure and analyze it with AI
 *     tags: [Brochures]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brochure:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Brochure uploaded and analyzed
 *       400:
 *         description: No file provided or not a PDF
 *       401:
 *         description: Not authenticated
 */
router.post('/upload', authenticate, (req, res, next) => {
  upload.single('brochure')(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ error: uploadErr.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided.' });
    }

    const id = generateId();
    const { originalname, filename, size } = req.file;
    const filePath = path.join(uploadDir, filename);

    // Insert record as 'processing'
    db.prepare(`
      INSERT INTO brochures (id, user_id, filename, original_name, file_size, status)
      VALUES (?, ?, ?, ?, ?, 'processing')
    `).run(id, req.user.id, filename, originalname, size);

    try {
      // Ensure the file path stays within the uploads directory (guard against path traversal)
      const resolvedFile = path.resolve(filePath);
      const resolvedUploadDir = path.resolve(uploadDir);
      if (!resolvedFile.startsWith(resolvedUploadDir + path.sep)) {
        return res.status(400).json({ error: 'Invalid file path.' });
      }

      // Extract text from PDF
      const fileBuffer = fs.readFileSync(resolvedFile);
      const pdfData = await pdfParse(fileBuffer);
      const rawText = (pdfData.text || '').trim();

      // AI analysis
      let extractedData = {};
      let aiSummary = '';

      if (isAIEnabled()) {
        const result = await analyzeWithAI(rawText, originalname);
        extractedData = result.extracted;
        aiSummary = result.summary;
      } else {
        aiSummary =
          'AI analysis is not configured. Set OPENAI_API_KEY in the environment to enable ' +
          'intelligent extraction. Raw text has been stored for manual review.';
      }

      // Update record with results
      db.prepare(`
        UPDATE brochures
        SET raw_text = ?, extracted_data = ?, ai_summary = ?, status = 'completed',
            updated_at = datetime('now')
        WHERE id = ?
      `).run(rawText, JSON.stringify(extractedData), aiSummary, id);

      const brochure = db.prepare('SELECT * FROM brochures WHERE id = ?').get(id);
      return res.status(201).json({
        brochure: { ...brochure, extracted_data: extractedData },
        message: 'Brochure uploaded and analyzed successfully.',
      });
    } catch (err) {
      db.prepare(`
        UPDATE brochures
        SET status = 'failed', error_message = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(err.message, id);
      next(err);
    }
  });
});

/**
 * @swagger
 * /api/brochures/{id}/create-property:
 *   post:
 *     summary: Create a property listing from an analyzed brochure
 *     tags: [Brochures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Optional overrides for extracted fields
 *     responses:
 *       201:
 *         description: Property created from brochure
 *       404:
 *         description: Brochure not found
 */
router.post('/:id/create-property', authenticate, (req, res, next) => {
  try {
    const brochure = db
      .prepare('SELECT * FROM brochures WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!brochure) {
      return res.status(404).json({ error: 'Brochure not found.' });
    }

    const extracted = safeJson(brochure.extracted_data, {});
    // Merge AI-extracted data with any manual overrides from the request body
    const data = { ...extracted, ...req.body };

    const propertyId = generateId();
    const title = data.title || brochure.original_name.replace('.pdf', '');
    const address = data.address || 'Address not extracted';
    const city = data.city || 'Unknown';
    const state = data.state || 'Unknown';
    const zip_code = data.zip_code || '00000';
    const property_type = normalizePropertyType(data.property_type);
    const price = parseFloat(data.price) || 0;

    db.prepare(`
      INSERT INTO properties (
        id, title, description, address, city, state, zip_code, property_type,
        status, price, bedrooms, bathrooms, square_feet, lot_size, year_built,
        images, features, listed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, ?, '[]', ?, ?)
    `).run(
      propertyId,
      title,
      data.description || brochure.ai_summary || null,
      address,
      city,
      state,
      zip_code,
      property_type,
      price,
      data.bedrooms ? parseInt(data.bedrooms, 10) : null,
      data.bathrooms ? parseFloat(data.bathrooms) : null,
      data.square_feet ? parseInt(data.square_feet, 10) : null,
      data.lot_size ? parseFloat(data.lot_size) : null,
      data.year_built ? parseInt(data.year_built, 10) : null,
      JSON.stringify(data.features || []),
      req.user.id,
    );

    // Link the brochure to the new property
    db.prepare(`
      UPDATE brochures SET property_id = ?, updated_at = datetime('now') WHERE id = ?
    `).run(propertyId, brochure.id);

    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    res.status(201).json({ property, message: 'Property listing created from brochure.' });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/brochures/{id}:
 *   delete:
 *     summary: Delete a brochure record and its uploaded file
 *     tags: [Brochures]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brochure deleted
 *       404:
 *         description: Brochure not found
 */
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const brochure = db
      .prepare('SELECT * FROM brochures WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!brochure) {
      return res.status(404).json({ error: 'Brochure not found.' });
    }

    // Remove file from disk (validate path stays inside uploads directory)
    const filePath = path.join(uploadDir, brochure.filename);
    const resolvedFile = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(uploadDir);
    if (resolvedFile.startsWith(resolvedUploadDir + path.sep) && fs.existsSync(resolvedFile)) {
      fs.unlinkSync(resolvedFile);
    }

    db.prepare('DELETE FROM brochures WHERE id = ?').run(brochure.id);
    res.json({ message: 'Brochure deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJson(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
}

function normalizePropertyType(type) {
  const valid = ['residential', 'commercial', 'industrial', 'land', 'mixed-use'];
  if (!type) return 'residential';
  const lower = type.toLowerCase();
  return valid.find((v) => lower.includes(v)) || 'residential';
}

async function analyzeWithAI(rawText, filename) {
  const openai = getOpenAIClient();
  const truncated = rawText.slice(0, 12000); // keep within token budget

  const systemPrompt = `You are an expert real estate data analyst. Extract structured property information from brochure text.
Return ONLY a valid JSON object with these fields (use null for anything not found):
{
  "title": string,
  "address": string,
  "city": string,
  "state": string (2-letter code),
  "zip_code": string,
  "country": "US",
  "property_type": "residential|commercial|industrial|land|mixed-use",
  "price": number,
  "bedrooms": number,
  "bathrooms": number,
  "square_feet": number,
  "lot_size": number,
  "year_built": number,
  "parking_spaces": number,
  "description": string,
  "features": [string],
  "summary": string (2-3 sentence investment summary)
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Analyze this real estate brochure (filename: ${filename}):\n\n${truncated}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = completion.choices[0].message.content || '{}';
  const parsed = JSON.parse(content);
  const { summary, ...extracted } = parsed;

  return {
    extracted,
    summary: summary || 'AI analysis complete. Review extracted data above.',
  };
}

module.exports = router;
