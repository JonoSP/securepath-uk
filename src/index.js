// src/index.js
// SecurePath UK API Server with comprehensive security

const express = require('express');
const config = require('./config');
const { setupSecurity } = require('./middleware/security');

const app = express();

// Apply security middleware FIRST
setupSecurity(app);

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

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: config.app.name,
        status: 'operational',
        security: 'enabled',
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
    // Log error but don't expose details to client
    console.error('Error:', err);
    
    // Send generic error response
    res.status(err.status || 500).json({
        error: config.app.isProduction ? 'Internal Server Error' : err.message,
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = config.app.port;
const server = app.listen(PORT, () => {
    console.log(\✅ SecurePath UK API running on port \\);
    console.log(\🔒 Security: ENABLED\);
    console.log(\🌍 Environment: \\);
    console.log(\🔗 URL: \\);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = app;
