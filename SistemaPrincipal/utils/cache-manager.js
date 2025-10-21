const redis = require('redis');
const { createSharedLogger } = require('./shared-logger');

class CacheManager {
    constructor() {
        this.logger = createSharedLogger('cache');
        this.client = null;
        this.memoryCache = new Map();
        this.isRedisAvailable = false;
    }

    async init() {
        try {
            this.client = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                connectTimeout: 1000,
                commandTimeout: 1000,
                retryDelayOnFailover: 100,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false
            });

            await this.client.connect();
            this.isRedisAvailable = true;
            this.logger.info('Redis cache connected');
        } catch (error) {
            this.logger.warn('Redis unavailable, using memory cache', { error: error.message });
            this.isRedisAvailable = false;
        }
    }

    async get(key) {
        try {
            if (this.isRedisAvailable) {
                const value = await this.client.get(key);
                return value ? JSON.parse(value) : null;
            }
            return this.memoryCache.get(key) || null;
        } catch (error) {
            this.logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            if (this.isRedisAvailable) {
                await this.client.setEx(key, ttl, JSON.stringify(value));
            } else {
                this.memoryCache.set(key, value);
                setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
            }
        } catch (error) {
            this.logger.error('Cache set error', { key, error: error.message });
        }
    }

    async del(key) {
        try {
            if (this.isRedisAvailable) {
                await this.client.del(key);
            } else {
                this.memoryCache.delete(key);
            }
        } catch (error) {
            this.logger.error('Cache delete error', { key, error: error.message });
        }
    }

    // Cache específico para usuários
    async getUser(telefone) {
        return await this.get(`user:${telefone}`);
    }

    async setUser(telefone, userData, ttl = 1800) {
        await this.set(`user:${telefone}`, userData, ttl);
    }

    // Cache para sessões WhatsApp
    async getSession(sessionId) {
        return await this.get(`session:${sessionId}`);
    }

    async setSession(sessionId, sessionData, ttl = 7200) {
        await this.set(`session:${sessionId}`, sessionData, ttl);
    }

    // Cache para consultas do banco
    async getQuery(queryKey) {
        return await this.get(`query:${queryKey}`);
    }

    async setQuery(queryKey, result, ttl = 600) {
        await this.set(`query:${queryKey}`, result, ttl);
    }
}

module.exports = new CacheManager();