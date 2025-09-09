const crypto = require('crypto');

class SecurityUtils {
    static sanitizeLog(input) {
        if (typeof input !== 'string') return input;
        return input.replace(/[\r\n\t]/g, '_').substring(0, 200);
    }

    static sanitizeHtml(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    static validateInput(input, maxLength = 1000) {
        if (!input || typeof input !== 'string') return false;
        if (input.length > maxLength) return false;
        const dangerousChars = /<script|javascript:|data:|vbscript:|onload|onerror/i;
        return !dangerousChars.test(input);
    }

    static generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    static createRateLimiter(maxRequests = 100, windowMs = 60000) {
        const requests = new Map();
        
        return (identifier) => {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            if (!requests.has(identifier)) {
                requests.set(identifier, []);
            }
            
            const userRequests = requests.get(identifier);
            const validRequests = userRequests.filter(time => time > windowStart);
            
            if (validRequests.length >= maxRequests) {
                return false;
            }
            
            validRequests.push(now);
            requests.set(identifier, validRequests);
            return true;
        };
    }
}

module.exports = SecurityUtils;