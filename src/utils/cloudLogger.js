// src/utils/cloudLogger.js
// Google Cloud Logging with Application Default Credentials (MORE SECURE)

const { Logging } = require('@google-cloud/logging');
const { LoggingWinston } = require('@google-cloud/logging-winston');
const winston = require('winston');
const path = require('path');

// Configure Google Cloud Logging
const projectId = process.env.GCP_PROJECT_ID || 'sp-uk-logs';

// Only use Google Cloud in production or when explicitly enabled
const useCloudLogging = process.env.NODE_ENV === 'production' || process.env.ENABLE_CLOUD_LOGGING === 'true';

let logging;
let loggingWinston;

if (useCloudLogging) {
    try {
        // Use Application Default Credentials - more secure than key files
        // In development: Uses gcloud auth application-default login
        // In production: Uses Render's environment variables
        logging = new Logging({
            projectId
            // No keyFilename needed - uses ADC automatically
        });
        
        loggingWinston = new LoggingWinston({
            projectId,
            // No keyFilename needed - uses ADC automatically
            logName: 'securepath-uk',
            resource: {
                type: 'generic_node',
                labels: {
                    project_id: projectId,
                    location: 'europe-west2', // London region
                    namespace: 'securepath-uk',
                    node_id: process.env.RENDER_SERVICE_ID || 'development'
                }
            },
            defaultCallback: err => {
                if (err) {
                    console.error('Error occurred sending log to Google Cloud:', err);
                }
            }
        });
        
        console.log('✅ Google Cloud Logging initialized with secure authentication');
        console.log('   Using Application Default Credentials (no key file needed)');
    } catch (error) {
        console.error('❌ Failed to initialize Google Cloud Logging:', error);
        console.log('⚠️  Falling back to local logging');
        console.log('   Run: gcloud auth application-default login');
    }
}

// Create loggers with appropriate transports
const createLogger = (logName, options = {}) => {
    const transports = [];
    
    // Always add console transport
    transports.push(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                return \\ [\]: \ \\;
            })
        )
    }));
    
    // Add Google Cloud transport if available
    if (loggingWinston) {
        transports.push(loggingWinston);
    }
    
    // Add local file transport for development
    if (!useCloudLogging) {
        const DailyRotateFile = require('winston-daily-rotate-file');
        
        // Create logs directory if it doesn't exist
        const fs = require('fs');
        const logsDir = path.join(__dirname, '../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        transports.push(new DailyRotateFile({
            filename: \logs/\-%DATE%.log\,
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '7d'
        }));
    }
    
    return winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        ),
        defaultMeta: {
            service: 'securepath-uk',
            environment: process.env.NODE_ENV || 'development',
            ...options.defaultMeta
        },
        transports
    });
};

// Create specialized loggers
const applicationLogger = createLogger('application');
const securityLogger = createLogger('security', {
    defaultMeta: { category: 'security' }
});
const auditLogger = createLogger('audit', {
    defaultMeta: { category: 'audit' }
});

// Security event helpers with cloud logging
const logSecurityEvent = async (event, details, severity = 'WARNING') => {
    const entry = {
        timestamp: new Date().toISOString(),
        event,
        severity,
        details,
        source: 'security-monitor'
    };
    
    securityLogger.warn(entry);
    
    // For critical security events, also create an alert
    if (severity === 'CRITICAL' || severity === 'ALERT') {
        if (logging) {
            // Create a more severe log entry that can trigger alerts
            const log = logging.log('security-alerts');
            const metadata = {
                severity: 'CRITICAL',
                resource: {
                    type: 'generic_node',
                    labels: {
                        project_id: projectId,
                        location: 'europe-west2'
                    }
                }
            };
            
            const alertEntry = log.entry(metadata, {
                message: \SECURITY ALERT: \\,
                details,
                timestamp: new Date().toISOString()
            });
            
            await log.write(alertEntry);
        }
    }
};

// Audit logging for compliance
const logAuditEvent = (action, user, resource, outcome) => {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        user: user || 'system',
        resource,
        outcome,
        source: 'audit-system'
    };
    
    auditLogger.info(entry);
};

// Export configured loggers
module.exports = {
    logger: applicationLogger,
    securityLogger,
    auditLogger,
    logSecurityEvent,
    logAuditEvent,
    
    // Convenience methods
    info: (message, meta) => applicationLogger.info(message, meta),
    warn: (message, meta) => applicationLogger.warn(message, meta),
    error: (message, meta) => applicationLogger.error(message, meta),
    
    // Security events
    security: {
        loginAttempt: (success, email, ip) => {
            logSecurityEvent(
                success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
                { email, ip, success },
                success ? 'INFO' : 'WARNING'
            );
        },
        
        suspiciousActivity: (activity, details) => {
            logSecurityEvent('SUSPICIOUS_ACTIVITY', { activity, ...details }, 'WARNING');
        },
        
        accessDenied: (resource, user, ip) => {
            logSecurityEvent('ACCESS_DENIED', { resource, user, ip }, 'WARNING');
        },
        
        dataAccess: (resource, action, user) => {
            logAuditEvent(\DATA_\\, user, resource, 'SUCCESS');
        },
        
        configChange: (setting, oldValue, newValue, user) => {
            logAuditEvent('CONFIG_CHANGE', user, setting, 'SUCCESS');
            logSecurityEvent('CONFIGURATION_MODIFIED', {
                setting,
                oldValue,
                newValue,
                user
            }, 'INFO');
        }
    }
};
