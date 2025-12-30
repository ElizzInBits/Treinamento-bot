const Bull = require('bull');
const { createSharedLogger } = require('./shared-logger');

class QueueManager {
    constructor() {
        this.logger = createSharedLogger('queue');
        this.queues = {};
        this.redisAvailable = false;
        this.redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 1,
            connectTimeout: 1000,
            enableOfflineQueue: false,
            retryStrategy: () => null // Não tentar reconectar
        };
    }

    createQueue(name, options = {}) {
        if (this.queues[name]) return this.queues[name];

        try {
            const defaultOptions = {
                redis: this.redisConfig,
                defaultJobOptions: {
                    removeOnComplete: 10,
                    removeOnFail: 5,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000
                    }
                }
            };

            this.queues[name] = new Bull(name, { ...defaultOptions, ...options });
            this.redisAvailable = true;
            return this.queues[name];
        } catch (error) {
            this.logger.warn(`Redis unavailable, queue ${name} disabled`, { error: error.message });
            // Retornar mock queue que executa jobs imediatamente
            return this.createMockQueue(name);
        }
    }

    createMockQueue(name) {
        const mockQueue = {
            name,
            process: (jobType, concurrency, handler) => {
                mockQueue._handler = handler;
            },
            add: async (jobType, data, options) => {
                if (mockQueue._handler) {
                    try {
                        await mockQueue._handler({ data, id: Date.now() });
                    } catch (error) {
                        this.logger.error(`Mock queue ${name} job failed`, { error: error.message });
                    }
                }
                return { id: Date.now() };
            },
            on: () => {},
            getWaiting: async () => [],
            getActive: async () => [],
            getCompleted: async () => [],
            getFailed: async () => []
        };
        this.queues[name] = mockQueue;
        return mockQueue;
    }

    // Queue para mensagens WhatsApp
    getMessageQueue() {
        if (!this.queues.messages) {
            try {
                const queue = this.createQueue('messages', {
                    defaultJobOptions: {
                        removeOnComplete: 20,
                        removeOnFail: 10,
                        attempts: 5,
                        delay: 1000
                    }
                });

            queue.process('send-message', 5, async (job) => {
                const { phone, endpoint, body, sendMessage } = job.data;
                return await sendMessage(phone, endpoint, body);
            });

            queue.on('completed', (job) => {
                this.logger.debug('Message sent', { jobId: job.id });
            });

                queue.on('failed', (job, err) => {
                    this.logger.error('Message failed', { jobId: job.id, error: err.message });
                });
            } catch (error) {
                this.logger.warn('Message queue unavailable, using mock', { error: error.message });
            }
        }
        return this.queues.messages;
    }

    // Queue para certificados
    getCertificateQueue() {
        if (!this.queues.certificates) {
            const queue = this.createQueue('certificates', {
                defaultJobOptions: {
                    removeOnComplete: 5,
                    removeOnFail: 3,
                    attempts: 2,
                    delay: 5000
                }
            });

            queue.process('generate-certificate', 2, async (job) => {
                const { userId, trainingData } = job.data;
                const { gerarCertificadoBanco } = require('../TemplatesMensagens/Certificados/certificados2');
                return await gerarCertificadoBanco(userId, trainingData);
            });
        }
        return this.queues.certificates;
    }

    // Queue para limpeza de dados
    getCleanupQueue() {
        if (!this.queues.cleanup) {
            const queue = this.createQueue('cleanup', {
                defaultJobOptions: {
                    removeOnComplete: 3,
                    removeOnFail: 2,
                    attempts: 1
                }
            });

            queue.process('cleanup-sessions', 1, async (job) => {
                const LimpezaSessoes = require('../BancoDeDados/limpezaSessoes');
                return await LimpezaSessoes.executarLimpeza();
            });

            // Limpeza automática removida para evitar erros Redis
        }
        return this.queues.cleanup;
    }

    async addJob(queueName, jobType, data, options = {}) {
        const queue = this.queues[queueName];
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        return await queue.add(jobType, data, options);
    }

    async getQueueStats() {
        const stats = {};
        for (const [name, queue] of Object.entries(this.queues)) {
            stats[name] = {
                waiting: await queue.getWaiting().then(jobs => jobs.length),
                active: await queue.getActive().then(jobs => jobs.length),
                completed: await queue.getCompleted().then(jobs => jobs.length),
                failed: await queue.getFailed().then(jobs => jobs.length)
            };
        }
        return stats;
    }
}

module.exports = new QueueManager();