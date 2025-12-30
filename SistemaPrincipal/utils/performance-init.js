const cacheManager = require('./cache-manager');
const queueManager = require('./queue-manager');
const rateLimiter = require('../middleware/rate-limiter');
const { createSharedLogger } = require('./shared-logger');

class PerformanceInit {
    constructor() {
        this.logger = createSharedLogger('performance');
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.logger.info('Initializing performance systems...');

            // Inicializar cache
            await cacheManager.init();

            // Inicializar filas (apenas se Redis estiver disponível)
            if (cacheManager.isRedisAvailable) {
                try {
                    queueManager.getMessageQueue();
                    queueManager.getCertificateQueue();
                    queueManager.getCleanupQueue();
                } catch (queueError) {
                    this.logger.warn('Queue initialization failed, continuing without queues', { error: queueError.message });
                }
            } else {
                this.logger.info('Redis unavailable, skipping queue initialization');
            }

            // Aplicar índices do banco
            await this.createDatabaseIndexes();

            this.initialized = true;
            this.logger.info('Performance systems initialized successfully');

            // Monitoramento de performance
            this.startPerformanceMonitoring();

        } catch (error) {
            this.logger.error('Failed to initialize performance systems', { error: error.message });
        }
    }

    async createDatabaseIndexes() {
        try {
            const { sequelize } = require('../BancoDeDados/database');
            
            // Criar índices (ignorar se já existem)
            const indexes = [
                'CREATE INDEX idx_usuarios_telefone ON usuarios(telefone)',
                'CREATE INDEX idx_sessoes_telefone ON sessoes_treinamentos(telefone)', 
                'CREATE INDEX idx_sessoes_created_at ON sessoes_treinamentos(createdAt)'
            ];

            for (const query of indexes) {
                try {
                    await sequelize.query(query);
                } catch (indexError) {
                    // Ignorar erros de índice duplicado
                    if (!indexError.message.includes('Duplicate key name')) {
                        throw indexError;
                    }
                }
            }
            this.logger.info('Database indexes verified');
        } catch (error) {
            this.logger.warn('Failed to create database indexes', { error: error.message });
        }
    }

    startPerformanceMonitoring() {
        setInterval(async () => {
            try {
                const memUsage = process.memoryUsage();
                // Desabilitado para evitar erros Redis
                // const queueStats = await queueManager.getQueueStats();

                this.logger.debug('Performance metrics', {
                    memory: {
                        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
                        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB'
                    }
                });

                // Alertas de performance
                if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
                    this.logger.warn('High memory usage detected', {
                        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
                    });
                }

            } catch (error) {
                this.logger.error('Performance monitoring error', { error: error.message });
            }
        }, 60000); // A cada minuto
    }

    getHealthStatus() {
        return {
            initialized: this.initialized,
            cache: cacheManager.isRedisAvailable ? 'redis' : 'memory',
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
        };
    }
}

module.exports = new PerformanceInit();