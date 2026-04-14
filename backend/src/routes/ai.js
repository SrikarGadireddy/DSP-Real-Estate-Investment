const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { getOpenAIClient, isAIEnabled } = require('../utils/openai');

const router = express.Router();

const AI_UNAVAILABLE = {
  error:
    'AI features require an OpenAI API key. Please set OPENAI_API_KEY in the server ' +
    'environment and restart the backend.',
  ai_enabled: false,
};

/**
 * @swagger
 * /api/ai/status:
 *   get:
 *     summary: Check if AI features are enabled
 *     tags: [AI]
 *     security: []
 *     responses:
 *       200:
 *         description: AI feature status
 */
router.get('/status', (_req, res) => {
  res.json({ ai_enabled: isAIEnabled() });
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Chat with the AI real-estate assistant
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string }
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role: { type: string, enum: [user, assistant] }
 *                     content: { type: string }
 *     responses:
 *       200:
 *         description: AI reply
 *       503:
 *         description: AI not configured
 */
router.post('/chat', authenticate, async (req, res, next) => {
  if (!isAIEnabled()) return res.status(503).json(AI_UNAVAILABLE);

  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required.' });
    }

    const openai = getOpenAIClient();

    const systemPrompt = `You are DSP Advisor, an expert AI assistant for the DSP Real Estate Investment Platform.
You help investors with:
- Understanding real estate market trends and investment strategies
- Analyzing properties for investment potential
- Calculating ROI, cap rates, cash flow, and mortgage payments
- Interpreting property brochures and documents
- Navigating the DSP platform features (properties, investments, dashboard, API integrations)

Always be concise, data-driven, and professional. When you do calculations, show your work.
Current platform: DSP Real Estate Investment — Express/SQLite backend, React frontend.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      // Include prior conversation (limit to last 10 exchanges for token efficiency)
      ...history.slice(-20).map(({ role, content }) => ({ role, content })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply, ai_enabled: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/ai/analyze-property/{id}:
 *   get:
 *     summary: Get AI investment analysis for a specific property
 *     tags: [AI]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: AI investment analysis
 *       404:
 *         description: Property not found
 *       503:
 *         description: AI not configured
 */
router.get('/analyze-property/:id', authenticate, async (req, res, next) => {
  if (!isAIEnabled()) return res.status(503).json(AI_UNAVAILABLE);

  try {
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found.' });

    const openai = getOpenAIClient();

    const prompt = `Analyze this real estate property for investment potential and provide a concise report:

Property: ${property.title}
Type: ${property.property_type}
Address: ${property.address}, ${property.city}, ${property.state} ${property.zip_code}
Price: $${property.price?.toLocaleString()}
Bedrooms: ${property.bedrooms ?? 'N/A'} | Bathrooms: ${property.bathrooms ?? 'N/A'}
Square Feet: ${property.square_feet ?? 'N/A'}
Year Built: ${property.year_built ?? 'N/A'}
Status: ${property.status}
Description: ${property.description || 'No description'}

Provide:
1. Investment potential score (1-10) with reasoning
2. Estimated cap rate range for this type of property in a typical market
3. Key strengths and risks
4. Suggested investment strategy (buy-and-hold, flip, BRRRR, etc.)
5. Questions an investor should ask before purchasing`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert real estate investment analyst. Provide structured, ' +
            'actionable investment analysis. Be concise and data-driven.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1200,
    });

    res.json({
      property_id: property.id,
      analysis: completion.choices[0].message.content,
      ai_enabled: true,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/ai/generate-description:
 *   post:
 *     summary: Generate an AI-enhanced property description
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               property_data: { type: object }
 *     responses:
 *       200:
 *         description: Generated description
 *       503:
 *         description: AI not configured
 */
router.post('/generate-description', authenticate, async (req, res, next) => {
  if (!isAIEnabled()) return res.status(503).json(AI_UNAVAILABLE);

  try {
    const { property_data = {} } = req.body;
    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional real estate copywriter. Write compelling, accurate, ' +
            'SEO-friendly property descriptions under 200 words.',
        },
        {
          role: 'user',
          content: `Write a property listing description for:\n${JSON.stringify(property_data, null, 2)}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 400,
    });

    res.json({
      description: completion.choices[0].message.content,
      ai_enabled: true,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/ai/investment-advice:
 *   post:
 *     summary: Get AI investment advice based on portfolio context
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               budget: { type: number }
 *               goals: { type: string }
 *               risk_tolerance: { type: string, enum: [low, medium, high] }
 *               preferred_types: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: AI investment advice
 *       503:
 *         description: AI not configured
 */
router.post('/investment-advice', authenticate, async (req, res, next) => {
  if (!isAIEnabled()) return res.status(503).json(AI_UNAVAILABLE);

  try {
    const { budget, goals, risk_tolerance = 'medium', preferred_types = [] } = req.body;

    // Fetch user's current portfolio summary for context
    const investments = db
      .prepare(`
        SELECT i.*, p.title, p.property_type, p.city, p.state, p.price
        FROM investments i
        JOIN properties p ON i.property_id = p.id
        WHERE i.user_id = ?
      `)
      .all(req.user.id);

    const totalInvested = investments.reduce((s, i) => s + (i.investment_amount || 0), 0);

    const openai = getOpenAIClient();

    const prompt = `Provide personalized real estate investment advice for this investor:

Current portfolio: ${investments.length} investment(s), total invested: $${totalInvested.toLocaleString()}
${investments.length > 0 ? `Properties: ${investments.map((i) => `${i.title} (${i.property_type}, ${i.city}, ${i.state})`).join('; ')}` : ''}
Available budget: ${budget ? `$${Number(budget).toLocaleString()}` : 'Not specified'}
Investment goals: ${goals || 'General wealth building'}
Risk tolerance: ${risk_tolerance}
Preferred property types: ${preferred_types.length > 0 ? preferred_types.join(', ') : 'Any'}

Provide:
1. Personalized strategy recommendation
2. Suggested portfolio diversification
3. Property types and markets to target
4. Key metrics to evaluate (target cap rate, cash-on-cash return, etc.)
5. Immediate next steps`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a certified real estate investment advisor. Give specific, actionable ' +
            'advice tailored to the investor\'s situation. Always include a disclaimer that ' +
            'this is educational guidance, not financial advice.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 1200,
    });

    res.json({
      advice: completion.choices[0].message.content,
      portfolio_context: { total_investments: investments.length, total_invested: totalInvested },
      ai_enabled: true,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
