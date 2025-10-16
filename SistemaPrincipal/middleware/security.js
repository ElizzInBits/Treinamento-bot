const SecurityUtils = require('../utils/security');
const Logger = require('../utils/logger');

const rateLimiter = SecurityUtils.createRateLimiter(1000, 60000);

function securityMiddleware(req, res, next) {
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Pular rate limiting para arquivos estáticos
    const isStaticFile = /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(req.path);
    
    if (!isStaticFile && !rateLimiter(clientIp)) {
        Logger.warn('Rate limit exceeded', { ip: clientIp });
        return res.status(429).json({ error: 'Too many requests' });
    }

    if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
                // Permitir assinaturas base64 (podem ser muito grandes)
                const maxLength = key === 'assinatura' ? 50000 : 1000;
                if (!SecurityUtils.validateInput(value, maxLength)) {
                    Logger.warn('Invalid input detected', { key, ip: clientIp });
                    return res.status(400).json({ error: 'Invalid input' });
                }
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