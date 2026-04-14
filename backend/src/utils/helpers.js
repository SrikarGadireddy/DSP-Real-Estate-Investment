const { v4: uuidv4 } = require('uuid');

function generateId() {
  return uuidv4();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function calculateROI(investmentAmount, currentValue, income) {
  if (!investmentAmount || investmentAmount === 0) return 0;
  const totalReturn = (currentValue - investmentAmount) + (income || 0);
  return (totalReturn / investmentAmount) * 100;
}

function calculateCashFlow(monthlyIncome, monthlyExpenses) {
  return (monthlyIncome || 0) - (monthlyExpenses || 0);
}

function calculateCapRate(netOperatingIncome, propertyValue) {
  if (!propertyValue || propertyValue === 0) return 0;
  return (netOperatingIncome / propertyValue) * 100;
}

function calculateMortgagePayment(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0;
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * l;
  return { page: p, limit: l, offset };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...sanitized } = user;
  return sanitized;
}

module.exports = {
  generateId,
  formatCurrency,
  calculateROI,
  calculateCashFlow,
  calculateCapRate,
  calculateMortgagePayment,
  paginate,
  sanitizeUser,
};
