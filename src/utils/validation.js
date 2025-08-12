// src/utils/validation.js
// Input validation and sanitization utilities

const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');

// Common validation rules
const validators = {
    email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email address'),
    
    password: body('password')
        .isLength({ min: 12 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 12 characters with uppercase, lowercase, number and special character'),
    
    companyName: body('companyName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z0-9\s\-\.]+$/)
        .withMessage('Company name contains invalid characters'),
    
    phone: body('phone')
        .optional()
        .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
        .withMessage('Invalid phone number format'),
    
    url: body('url')
        .optional()
        .isURL({ protocols: ['https'] })
        .withMessage('Only HTTPS URLs are allowed'),
    
    id: param('id')
        .isMongoId()
        .withMessage('Invalid ID format')
};

// Sanitize input
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        return xss(input.trim());
    }
    if (typeof input === 'object') {
        const sanitized = {};
        for (const key in input) {
            sanitized[key] = sanitizeInput(input[key]);
        }
        return sanitized;
    }
    return input;
};

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed',
            details: errors.array() 
        });
    }
    
    // Sanitize all inputs
    req.body = sanitizeInput(req.body);
    req.query = sanitizeInput(req.query);
    
    next();
};

module.exports = {
    validators,
    sanitizeInput,
    validate
};
