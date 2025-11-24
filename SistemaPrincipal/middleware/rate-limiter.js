const rateLimit = require('express-rate-limit');
const redis = require('redis');
let RedisStore;

try {
    RedisStore = require('rate-limit-redis');
} catch (e) {
    RedisStore = null;
}
const { createSharedLogger } = require('../utils/shared-logger');

class RateLimiter {
    constructor() {
        this.logger = createSharedLogger('rate-limiter');
        this.memoryStore = new Map();
        this.redisClient = null;
        this.initRedis();
    }

    async initRedis() {
        try {
            this.redisClient = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                connectTimeout: 1000,
                commandTimeout: 1000,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false
            });
            await this.redisClient.connect();
            this.logger.info('Redis rate limiter connected');
        } catch (error) {
            this.logger.warn('Redis unavailable for rate limiting, using memory store');
        }
    }

    // Rate limiter para API
    getApiLimiter() {
        return rateLimit({
            windowMs: 1 * 60 * 1000,
            max: 1000, 
            message: {
                error: 'Muitas requisições. Tente novamente em 1 minuto.',
                retryAfter: 60
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    // Rate limiter para WhatsApp (por telefone)
    checkWhatsAppLimit(phone) {
        const key = `whatsapp:${phone}`;
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minuto
        const maxMessages = 10; // 10 mensagens por minuto

        if (this.redisClient) {
            return this.checkRedisLimit(key, windowMs, maxMessages);
        } else {
            return this.checkMemoryLimit(key, windowMs, maxMessages, now);
        }
    }

    async checkRedisLimit(key, windowMs, maxMessages) {
        try {
            const current = await this.redisClient.incr(key);
            if (current === 1) {
                await this.redisClient.expire(key, Math.ceil(windowMs / 1000));
            }
            return current <= maxMessages;
        } catch (error) {
            this.logger.error('Redis rate limit error', { error: error.message });
            return true; // Permitir em caso de erro
        }
    }

    checkMemoryLimit(key, windowMs, maxMessages, now) {
        const record = this.memoryStore.get(key) || { count: 0, resetTime: now + windowMs };

        if (now > record.resetTime) {
            record.count = 1;
            record.resetTime = now + windowMs;
        } else {
            record.count++;
        }

        this.memoryStore.set(key, record);

        // Limpeza automática
        setTimeout(() => {
            if (this.memoryStore.get(key)?.resetTime <= Date.now()) {
                this.memoryStore.delete(key);
            }
        }, windowMs);

        return record.count <= maxMessages;
    }

    // Rate limiter para certificados
    checkCertificateLimit(userId) {
        const key = `certificate:${userId}`;
        const windowMs = 24 * 60 * 60 * 1000; // 24 horas
        const maxCertificates = 3; // 3 certificados por dia

        return this.redisClient ?
            this.checkRedisLimit(key, windowMs, maxCertificates) :
            this.checkMemoryLimit(key, windowMs, maxCertificates, Date.now());
    }

    // Middleware para Express
    getExpressMiddleware(options = {}) {
        const { windowMs = 1 * 60 * 1000, max = 1000, message } = options;

        return (req, res, next) => {
            const key = `api:${req.ip}`;
            const allowed = this.checkMemoryLimit(key, windowMs, max, Date.now());

            if (!allowed) {
                return res.status(429).json({
                    error: message || 'Rate limit exceeded',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }

            next();
        };
    }
}

module.exports = new RateLimiter();