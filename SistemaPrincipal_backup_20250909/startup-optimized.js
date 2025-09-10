const SystemOptimizations = require('./optimizations');
const Logger = require('./utils/logger');

async function startOptimizedSystem() {
    try {
        Logger.info('Starting optimized system');
        
        // Executar otimizações
        const optimizations = await SystemOptimizations.runFullOptimization();
        
        // Iniciar servidor frontend
        require('./front-end/server-front.js');
        
        Logger.info('Optimized system started successfully', optimizations);
        
        // Monitoramento de performance
        setInterval(() => {
            const memUsage = process.memoryUsage();
            Logger.debug('Memory usage', {
                rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
            });
        }, 300000); // 5 minutos
        
    } catch (error) {
        Logger.error('Failed to start optimized system', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startOptimizedSystem();
}

module.exports = { startOptimizedSystem };