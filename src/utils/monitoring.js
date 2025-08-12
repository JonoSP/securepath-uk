// src/utils/monitoring.js
// Security monitoring and metrics collection

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('./logger');

class SecurityMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                unauthorized: 0,
                rateLimit: 0
            },
            security: {
                loginAttempts: 0,
                loginSuccess: 0,
                suspiciousRequests: 0,
                blockedIPs: new Set()
            },
            performance: {
                avgResponseTime: 0,
                uptime: process.uptime()
            }
        };
        
        // Update metrics every minute
        setInterval(() => this.saveMetrics(), 60000);
    }
    
    // Track request metrics
    trackRequest(statusCode, responseTime) {
        this.metrics.requests.total++;
        
        if (statusCode >= 200 && statusCode < 300) {
            this.metrics.requests.successful++;
        } else if (statusCode >= 400) {
            this.metrics.requests.failed++;
            
            if (statusCode === 401 || statusCode === 403) {
                this.metrics.requests.unauthorized++;
            } else if (statusCode === 429) {
                this.metrics.requests.rateLimit++;
            }
        }
        
        // Update average response time
        const total = this.metrics.requests.total;
        const currentAvg = this.metrics.performance.avgResponseTime;
        this.metrics.performance.avgResponseTime = 
            (currentAvg * (total - 1) + responseTime) / total;
    }
    
    // Track security events
    trackSecurityEvent(event, details = {}) {
        switch(event) {
            case 'LOGIN_ATTEMPT':
                this.metrics.security.loginAttempts++;
                if (details.success) {
                    this.metrics.security.loginSuccess++;
                }
                break;
            case 'SUSPICIOUS_REQUEST':
                this.metrics.security.suspiciousRequests++;
                if (details.ip) {
                    this.trackSuspiciousIP(details.ip);
                }
                break;
        }
    }
    
    // Track suspicious IPs
    trackSuspiciousIP(ip) {
        this.metrics.security.blockedIPs.add(ip);
        
        // Auto-block after 5 suspicious requests
        const ipRequests = Array.from(this.metrics.security.blockedIPs)
            .filter(blockedIp => blockedIp === ip).length;
            
        if (ipRequests >= 5) {
            logger.error(\Auto-blocking IP due to suspicious activity: \\);
            // In production, would add to firewall rules
        }
    }
    
    // Get current metrics
    getMetrics() {
        return {
            ...this.metrics,
            performance: {
                ...this.metrics.performance,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                timestamp: new Date().toISOString()
            },
            security: {
                ...this.metrics.security,
                blockedIPs: Array.from(this.metrics.security.blockedIPs)
            }
        };
    }
    
    // Save metrics to file
    async saveMetrics() {
        try {
            const metricsDir = path.join(__dirname, '../../logs/metrics');
            await fs.mkdir(metricsDir, { recursive: true });
            
            const filename = \metrics-\.json\;
            const filepath = path.join(metricsDir, filename);
            
            const existingData = await this.loadExistingMetrics(filepath);
            existingData.push(this.getMetrics());
            
            await fs.writeFile(filepath, JSON.stringify(existingData, null, 2));
        } catch (error) {
            logger.error('Failed to save metrics', error);
        }
    }
    
    // Load existing metrics
    async loadExistingMetrics(filepath) {
        try {
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        } catch {
            return [];
        }
    }
    
    // Generate security report
    generateSecurityReport() {
        const metrics = this.getMetrics();
        const loginSuccessRate = metrics.security.loginAttempts > 0
            ? (metrics.security.loginSuccess / metrics.security.loginAttempts * 100).toFixed(2)
            : 0;
        
        return {
            summary: {
                status: metrics.security.suspiciousRequests < 10 ? 'SECURE' : 'ALERT',
                uptime: \\ hours\,
                totalRequests: metrics.requests.total,
                successRate: \\%\,
                avgResponseTime: \\ms\
            },
            security: {
                loginSuccessRate: \\%\,
                suspiciousRequests: metrics.security.suspiciousRequests,
                blockedIPs: metrics.security.blockedIPs.length,
                unauthorizedAttempts: metrics.requests.unauthorized,
                rateLimitHits: metrics.requests.rateLimit
            },
            recommendations: this.generateRecommendations(metrics)
        };
    }
    
    // Generate security recommendations
    generateRecommendations(metrics) {
        const recommendations = [];
        
        if (metrics.security.suspiciousRequests > 10) {
            recommendations.push('HIGH: Elevated suspicious activity detected. Review security logs.');
        }
        
        if (metrics.requests.unauthorized > 20) {
            recommendations.push('MEDIUM: Multiple unauthorized access attempts. Consider IP blocking.');
        }
        
        if (metrics.requests.rateLimit > 50) {
            recommendations.push('LOW: Rate limiting frequently triggered. Consider adjusting limits.');
        }
        
        const loginSuccessRate = metrics.security.loginSuccess / metrics.security.loginAttempts;
        if (loginSuccessRate < 0.5 && metrics.security.loginAttempts > 10) {
            recommendations.push('MEDIUM: Low login success rate. Possible brute force attempts.');
        }
        
        return recommendations.length > 0 ? recommendations : ['All security metrics within normal parameters.'];
    }
}

// Create singleton instance
const monitor = new SecurityMonitor();

module.exports = monitor;
