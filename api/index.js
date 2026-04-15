// Vercel serverless entry point for the Express backend.
//
// Vercel's Lambda runtime has a read-only filesystem except for /tmp.
// Set writable paths *before* requiring the app so that database.js and
// brochures.js (which resolve these paths at module-load time) use /tmp.
if (!process.env.DB_PATH) {
  process.env.DB_PATH = '/tmp/dsp_real_estate.db';
}
if (!process.env.UPLOADS_DIR) {
  process.env.UPLOADS_DIR = '/tmp/uploads';
}

module.exports = require('../backend/src/app');
