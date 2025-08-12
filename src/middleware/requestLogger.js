// src/middleware/requestLogger.js
// HTTP request logging with security focus

const morgan = require('morgan');
const { logger, securityEvents } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Create custom tokens
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('real-ip', (req) => req.ip || req.connection.remoteAddress);
morgan.token('security-flag', (req) => {
    // Flag suspicious patterns
    if (req.url.includes('..') || req.url.includes('//')) return 'SUSPICIOUS';
    if (req.url.includes('.php') || req.url.includes('.asp')) return 'PROBE';
    if (req.url.includes('admin') || req.url.includes('wp-')) return 'SCAN';
    return '-';
});

// Custom format for security logging
const securityFormat = ':real-ip - :user-id [:date[clf]] ":method :url" :status :response-time ms ":user-agent" :security-flag';

// Stream to Winston
const stream = {
    write: (message) => {
        // Remove newline
        const log = message.trim();
        
        // Check for security indicators
        if (log.includes('SUSPICIOUS') || log.includes('PROBE') || log.includes('SCAN')) {
            logger.warn('Suspicious request detected', { log });
            
            // Parse and log as security event
            const parts = log.split(' ');
            const ip = parts[0];
            const flag = parts[parts.length - 1];
            securityEvents.suspiciousActivity(\HTTP \\, { ip, log });
        } else if (log.includes(' 401 ') || log.includes(' 403 ')) {
            logger.warn('Unauthorized request', { log });
        } else if (log.includes(' 500 ')) {
            logger.error('Server error', { log });
        } else {
            logger.info('HTTP Request', { log });
        }
    }
};

// Create the middleware
const requestLogger = morgan(securityFormat, { stream });

// Additional security logging middleware
const securityRequestLogger = (req, res, next) => {
    // Log high-risk operations
    const highRiskPaths = ['/api/auth', '/api/admin', '/api/config'];
    const isHighRisk = highRiskPaths.some(path => req.path.startsWith(path));
    
    if (isHighRisk) {
        securityEvents.dataAccess(req.path, req.method, req);
    }
    
    // Log response
    const originalSend = res.send;
    res.send = function(data) {
        // Log failed authentication attempts
        if (res.statusCode === 401) {
            securityEvents.unauthorizedAccess(req.path, req);
        }
        
        // Log rate limiting
        if (res.statusCode === 429) {
            securityEvents.rateLimitExceeded(req.path, req);
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

module.exports = {
    requestLogger,
    securityRequestLogger
};
