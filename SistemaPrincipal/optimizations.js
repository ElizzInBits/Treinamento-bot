const SecurityUtils = require('./utils/security');
const PerformanceUtils = require('./utils/performance');
const Logger = require('./utils/logger');

class SystemOptimizations {
    static async optimizeDatabase() {
        try {
            const { sequelize } = require('./BancoDeDados/database');
            
            // Otimizar queries com cache
            const cachedQuery = PerformanceUtils.memoize(async (sql, options) => {
                return await sequelize.query(sql, options);
            }, 300000); // 5 minutos cache
            
            // Adicionar índices críticos
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_usuarios_telefone_status 
                ON usuarios(telefone, statusTreinamento)
            `);
            
            await sequelize.query(`
                CREATE INDEX IF NOT EXISTS idx_interacoes_telefone_created 
                ON interacoes(telefone, createdAt DESC)
            `);
            
            Logger.info('Database optimizations applied');
            return { success: true, cached: cachedQuery };
        } catch (error) {
            Logger.error('Database optimization failed', error);
            return { success: false, error: error.message };
        }
    }

    static optimizeMemory() {
        // Limpar cache periodicamente
        setInterval(() => {
            const stats = PerformanceUtils.getCacheStats();
            if (stats.size > 1000) {
                PerformanceUtils.clearCache();
                Logger.info('Cache cleared', stats);
            }
        }, 600000); // 10 minutos

        // Forçar garbage collection se disponível
        if (global.gc) {
            setInterval(() => {
                global.gc();
                Logger.debug('Garbage collection executed');
            }, 300000); // 5 minutos
        }
    }

    static createOptimizedImageManager() {
        const imageCache = new Map();
        const maxCacheSize = 50;
        
        return {
            async getImage(key, url) {
                if (imageCache.has(key)) {
                    return imageCache.get(key);
                }
                
                try {
                    // ImageManager removido - usar cache simples
                    const result = null;
                    
                    if (imageCache.size >= maxCacheSize) {
                        const firstKey = imageCache.keys().next().value;
                        imageCache.delete(firstKey);
                    }
                    
                    imageCache.set(key, result);
                    return result;
                } catch (error) {
                    Logger.error('Image loading failed', { key, error: error.message });
                    return null;
                }
            },
            
            clearCache() {
                imageCache.clear();
            }
        };
    }

    static createSecureLogger() {
        return {
            log: (level, message, data) => {
                const sanitizedMessage = SecurityUtils.sanitizeLog(message);
                const sanitizedData = data ? SecurityUtils.sanitizeLog(JSON.stringify(data)) : '';
                console.log(`[${new Date().toISOString()}] ${level}: ${sanitizedMessage} ${sanitizedData}`);
            }
        };
    }

    static async runFullOptimization() {
        Logger.info('Starting system optimization');
        
        const results = {
            database: await SystemOptimizations.optimizeDatabase(),
            memory: SystemOptimizations.optimizeMemory(),
            // imageManager removido
            logger: SystemOptimizations.createSecureLogger()
        };
        
        Logger.info('System optimization completed', results);
        return results;
    }
}

module.exports = SystemOptimizations;