// src/utils/logger.js
// Comprehensive security-focused logging system

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        });
    })
);

// Security event format
const securityFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, event, ip, user, details }) => {
        return JSON.stringify({
            timestamp,
            level,
            event,
            ip,
            user: user || 'anonymous',
            details
        });
    })
);

// Transport for all logs
const generalTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat
});

// Transport for error logs
const errorTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'error',
    format: logFormat
});

// Transport for security events
const securityTransport = new DailyRotateFile({
    filename: path.join(logsDir, 'security-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '90d', // Keep security logs longer
    format: securityFormat
});

// Create main logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        generalTransport,
        errorTransport
    ]
});

// Create security logger
const securityLogger = winston.createLogger({
    level: 'info',
    format: securityFormat,
    transports: [securityTransport]
});

// Add console output in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Security event logging functions
const logSecurityEvent = (event, details, req = null) => {
    const logEntry = {
        event,
        ip: req ? (req.ip || req.connection.remoteAddress) : 'system',
        user: req?.user?.id || 'anonymous',
        userAgent: req?.headers['user-agent'],
        details
    };
    
    securityLogger.info(logEntry);
    
    // Also log to main logger for visibility
    logger.warn(\Security Event: \\, logEntry);
};

// Specific security event helpers
const securityEvents = {
    loginAttempt: (success, email, req) => {
        logSecurityEvent(
            success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            { email, success },
            req
        );
    },
    
    suspiciousActivity: (activity, req) => {
        logSecurityEvent('SUSPICIOUS_ACTIVITY', { activity }, req);
    },
    
    rateLimitExceeded: (endpoint, req) => {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { endpoint }, req);
    },
    
    unauthorizedAccess: (resource, req) => {
        logSecurityEvent('UNAUTHORIZED_ACCESS', { resource }, req);
    },
    
    dataAccess: (resource, action, req) => {
        logSecurityEvent('DATA_ACCESS', { resource, action }, req);
    },
    
    configChange: (setting, oldValue, newValue, req) => {
        logSecurityEvent('CONFIG_CHANGE', { setting, oldValue, newValue }, req);
    },
    
    errorOccurred: (error, req) => {
        logSecurityEvent('ERROR', { 
            message: error.message,
            stack: error.stack,
            code: error.code 
        }, req);
    }
};

module.exports = {
    logger,
    securityLogger,
    logSecurityEvent,
    securityEvents
};
