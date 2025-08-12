// config/index.js
// Secure configuration loader with validation

require('dotenv').config();

// Validation function
function validateEnv(key, defaultValue = null, required = false) {
    const value = process.env[key] || defaultValue;
    
    if (required && !value) {
        console.error(\❌ Missing required environment variable: \\);
        process.exit(1);
    }
    
    // Security check - warn if using default secret in production
    if (process.env.NODE_ENV === 'production' && 
        key.includes('SECRET') && 
        value === defaultValue) {
        console.error(\❌ Using default secret in production for: \\);
        process.exit(1);
    }
    
    return value;
}

// Configuration object
const config = {
    app: {
        name: validateEnv('APP_NAME', 'SecurePath_UK'),
        url: validateEnv('APP_URL', 'http://localhost:3000'),
        port: parseInt(validateEnv('PORT', '3000')),
        env: validateEnv('NODE_ENV', 'development'),
        isProduction: process.env.NODE_ENV === 'production'
    },
    
    security: {
        sessionSecret: validateEnv('SESSION_SECRET', null, true),
        jwtSecret: validateEnv('JWT_SECRET', null, true),
        encryptionKey: validateEnv('ENCRYPTION_KEY', null, true),
        
        session: {
            name: validateEnv('SESSION_NAME', 'session'),
            maxAge: parseInt(validateEnv('SESSION_MAX_AGE', '3600000')),
            secure: validateEnv('SESSION_SECURE', 'true') === 'true',
            httpOnly: validateEnv('SESSION_HTTP_ONLY', 'true') === 'true',
            sameSite: validateEnv('SESSION_SAME_SITE', 'strict')
        },
        
        headers: {
            hsts: {
                maxAge: parseInt(validateEnv('HSTS_MAX_AGE', '31536000')),
                includeSubDomains: true,
                preload: true
            },
            frameOptions: validateEnv('FRAME_OPTIONS', 'DENY'),
            xssProtection: validateEnv('XSS_PROTECTION', '1; mode=block'),
            contentTypeOptions: validateEnv('CONTENT_TYPE_OPTIONS', 'nosniff'),
            referrerPolicy: validateEnv('REFERRER_POLICY', 'strict-origin-when-cross-origin')
        },
        
        rateLimit: {
            windowMs: parseInt(validateEnv('RATE_LIMIT_WINDOW_MS', '900000')),
            max: parseInt(validateEnv('RATE_LIMIT_MAX_REQUESTS', '100'))
        },
        
        cors: {
            origin: validateEnv('CORS_ORIGIN', 'http://localhost:3000'),
            credentials: validateEnv('CORS_CREDENTIALS', 'true') === 'true'
        }
    },
    
    logging: {
        level: validateEnv('LOG_LEVEL', 'info'),
        enableMetrics: validateEnv('ENABLE_METRICS', 'true') === 'true'
    }
};

// Freeze config to prevent runtime modification
Object.freeze(config);
Object.freeze(config.app);
Object.freeze(config.security);
Object.freeze(config.logging);

module.exports = config;
