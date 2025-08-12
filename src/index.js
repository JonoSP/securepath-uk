// src/index.js
// SecurePath UK API Server with comprehensive security and monitoring

const express = require('express');
const config = require('./config');
const { setupSecurity } = require('./middleware/security');
const { requestLogger, securityRequestLogger } = require('./middleware/requestLogger');
const monitor = require('./utils/monitoring');
const { logger, securityEvents } = require('./utils/logger');

const app = express();

// Apply security middleware FIRST
setupSecurity(app);

// Apply logging middleware
app.use(requestLogger);
app.use(securityRequestLogger);

// Track metrics
app.use((req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        monitor.trackRequest(res.statusCode, responseTime);
    });
    
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Security check endpoint
app.get('/api/security-check', (req, res) => {
    res.json({
        headers: {
            hsts: res.get('Strict-Transport-Security') ? 'enabled' : 'disabled',
            xframe: res.get('X-Frame-Options') ? 'enabled' : 'disabled',
            xss: res.get('X-XSS-Protection') ? 'enabled' : 'disabled',
            contentType: res.get('X-Content-Type-Options') ? 'enabled' : 'disabled',
        },
        cors: 'configured',
        rateLimit: 'active',
        environment: config.app.env
    });
});

// Security monitoring endpoint (protect in production!)
app.get('/api/security-report', (req, res) => {
    // In production, this should require authentication
    const report = monitor.generateSecurityReport();
    res.json(report);
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: config.app.name,
        status: 'operational',
        security: 'enabled',
        monitoring: 'active',
        documentation: '/api/docs'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Error handler
app.use((err, req, res, next) => {
    // Log error
    logger.error('Application error', { 
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });
    
    securityEvents.errorOccurred(err, req);
    
    // Send generic error response
    res.status(err.status || 500).json({
        error: config.app.isProduction ? 'Internal Server Error' : err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = config.app.port;
const server = app.listen(PORT, () => {
    logger.info(\SecurePath UK API started\, {
        port: PORT,
        environment: config.app.env,
        security: 'enabled',
        monitoring: 'active'
    });
    
    console.log(\✅ SecurePath UK API running on port \\);
    console.log(\🔒 Security: ENABLED\);
    console.log(\📊 Monitoring: ACTIVE\);
    console.log(\🌍 Environment: \\);
    console.log(\🔗 URL: \\);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

module.exports = app;
