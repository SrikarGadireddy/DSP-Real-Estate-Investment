const express = require('express');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { calculateROI, formatCurrency } = require('../utils/helpers');

const router = express.Router();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get portfolio dashboard summary
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Portfolio dashboard data
 */
router.get('/', authenticate, (req, res, next) => {
  try {
    const investments = db.prepare(`
      SELECT i.*, p.price AS property_price, p.title AS property_title
      FROM investments i
      LEFT JOIN properties p ON i.property_id = p.id
      WHERE i.user_id = ?
    `).all(req.user.id);

    const totalInvested = investments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0);
    const totalPropertyValue = investments.reduce((sum, inv) => sum + ((inv.property_price || 0) * (inv.ownership_percentage || 0) / 100), 0);
    const totalMonthlyIncome = investments.reduce((sum, inv) => sum + (inv.monthly_income || 0), 0);
    const activeInvestments = investments.filter((inv) => inv.status === 'active').length;
    const portfolioROI = calculateROI(totalInvested, totalPropertyValue, totalMonthlyIncome * 12);

    const recentInvestments = db.prepare(`
      SELECT i.*, p.title AS property_title, p.city, p.state
      FROM investments i
      LEFT JOIN properties p ON i.property_id = p.id
      WHERE i.user_id = ?
      ORDER BY i.created_at DESC
      LIMIT 5
    `).all(req.user.id);

    res.json({
      summary: {
        total_invested: totalInvested,
        total_invested_formatted: formatCurrency(totalInvested),
        total_property_value: totalPropertyValue,
        total_property_value_formatted: formatCurrency(totalPropertyValue),
        total_monthly_income: totalMonthlyIncome,
        total_monthly_income_formatted: formatCurrency(totalMonthlyIncome),
        active_investments: activeInvestments,
        total_investments: investments.length,
        portfolio_roi: Math.round(portfolioROI * 100) / 100,
      },
      recent_investments: recentInvestments,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get investment analytics
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Investment analytics data
 */
router.get('/analytics', authenticate, (req, res, next) => {
  try {
    const byType = db.prepare(`
      SELECT p.property_type, COUNT(*) AS count, SUM(i.investment_amount) AS total_amount
      FROM investments i
      JOIN properties p ON i.property_id = p.id
      WHERE i.user_id = ?
      GROUP BY p.property_type
    `).all(req.user.id);

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) AS count, SUM(investment_amount) AS total_amount
      FROM investments
      WHERE user_id = ?
      GROUP BY status
    `).all(req.user.id);

    const monthlyTrend = db.prepare(`
      SELECT strftime('%Y-%m', investment_date) AS month, COUNT(*) AS count, SUM(investment_amount) AS total_amount
      FROM investments
      WHERE user_id = ?
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all(req.user.id);

    res.json({ by_type: byType, by_status: byStatus, monthly_trend: monthlyTrend });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
