const SecurityUtils = require('../utils/security');
const Logger = require('../utils/logger');

const rateLimiter = SecurityUtils.createRateLimiter(100, 60000);

function securityMiddleware(req, res, next) {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    if (!rateLimiter(clientIp)) {
        Logger.warn('Rate limit exceeded', { ip: clientIp });
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string' && !SecurityUtils.validateInput(value)) {
                Logger.warn('Invalid input detected', { key, ip: clientIp });
                return res.status(400).json({ error: 'Invalid input' });
            }
        }
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    next();
}

module.exports = securityMiddleware;