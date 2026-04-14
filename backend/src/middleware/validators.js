const { body, validationResult } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('First name is required.'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email address is required.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

const propertyValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Property title is required.'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number.'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required.'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required.'),
  body('state')
    .trim()
    .notEmpty()
    .withMessage('State is required.'),
  body('zip_code')
    .trim()
    .notEmpty()
    .withMessage('Zip code is required.'),
  body('property_type')
    .isIn(['residential', 'commercial', 'industrial', 'land', 'mixed-use'])
    .withMessage('Invalid property type.'),
];

const investmentValidation = [
  body('property_id')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required.'),
  body('investment_amount')
    .isFloat({ min: 0 })
    .withMessage('Investment amount must be a positive number.'),
];

const apiKeyValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('API key name is required.'),
];

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed.',
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  next();
}

module.exports = {
  registerValidation,
  loginValidation,
  propertyValidation,
  investmentValidation,
  apiKeyValidation,
  validate,
};
