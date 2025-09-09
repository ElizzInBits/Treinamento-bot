const Logger = require('./utils/logger');

async function quickStart() {
    try {
        Logger.info('Starting system with optimizations');
        
        // Aplicar otimizações básicas sem dependências externas
        const PerformanceUtils = require('./utils/performance');
        
        // Limpar cache periodicamente
        setInterval(() => {
            const stats = PerformanceUtils.getCacheStats();
            if (stats.size > 500) {
                PerformanceUtils.clearCache();
                Logger.info('Cache cleared', stats);
            }
        }, 300000);
        
        // Iniciar servidor
        require('./front-end/server-front.js');
        
        Logger.info('System started successfully');
        
    } catch (error) {
        Logger.error('Failed to start system', error);
        console.log('Fallback: Starting without optimizations...');
        require('./front-end/server-front.js');
    }
}

if (require.main === module) {
    quickStart();
}

module.exports = { quickStart };