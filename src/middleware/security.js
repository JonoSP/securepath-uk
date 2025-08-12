// src/middleware/security.js
// Comprehensive security middleware configuration

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const config = require('../config');

// Rate limiting configuration
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    return rateLimit({
        windowMs,
        max,
        message: 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too many requests',
                retryAfter: res.getHeader('Retry-After')
            });
        }
    });
};

// Specific rate limiters for different endpoints
const limiters = {
    general: createRateLimiter(15 * 60 * 1000, 100),  // 100 requests per 15 mins
    auth: createRateLimiter(15 * 60 * 1000, 5),       // 5 auth attempts per 15 mins
    api: createRateLimiter(1 * 60 * 1000, 30),        // 30 API calls per minute
};

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            config.app.url,
            'http://localhost:3000',
            'https://securepath-uk.onrender.com'
        ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400 // 24 hours
};

// Security headers configuration
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            scriptSrc: ["'self'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: config.app.isProduction ? [] : null,
        },
    },
    hsts: {
        maxAge: config.security.headers.hsts.maxAge,
        includeSubDomains: true,
        preload: true
    }
};

// Main security middleware function
const setupSecurity = (app) => {
    // Enable trust proxy for accurate IP addresses
    app.set('trust proxy', 1);
    
    // Basic security headers
    app.use(helmet(helmetConfig));
    
    // CORS
    app.use(cors(corsOptions));
    
    // Body parsing security
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Data sanitization against NoSQL query injection
    app.use(mongoSanitize());
    
    // Data sanitization against XSS
    app.use(xss());
    
    // Prevent HTTP Parameter Pollution
    app.use(hpp());
    
    // Apply rate limiting
    app.use('/api/', limiters.api);
    app.use('/auth/', limiters.auth);
    app.use('/', limiters.general);
    
    // Custom security headers
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // Remove fingerprinting headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        
        next();
    });
    
    // Security logging
    app.use((req, res, next) => {
        // Log suspicious activities
        if (req.url.includes('..') || req.url.includes('//')) {
            console.warn(\⚠️ Suspicious URL pattern: \ from IP: \\);
        }
        
        next();
    });
};

module.exports = {
    setupSecurity,
    limiters,
    corsOptions
};
