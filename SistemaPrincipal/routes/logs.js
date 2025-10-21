const express = require('express');
const { getRecentLogs, clearOldLogs, logger } = require('../utils/winston-logger');
const { getSharedLogs, clearSharedLogs } = require('../utils/shared-logger');
const router = express.Router();

// Endpoint para obter logs recentes
router.get('/recent', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level || null;
    const service = req.query.service || null;
    const search = req.query.search || null;
    
    let logs = getSharedLogs(1000, level);
    
    // Filtrar por serviço
    if (service) {
      logs = logs.filter(log => log.service === service);
    }
    
    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.service.toLowerCase().includes(searchLower) ||
        JSON.stringify(log).toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar limite
    logs = logs.slice(0, limit);
    
    res.json({
      success: true,
      logs: logs,
      total: logs.length
    });
  } catch (error) {
    logger.error('Erro ao obter logs recentes', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para limpar buffer de logs
router.post('/clear', (req, res) => {
  try {
    clearSharedLogs();
    res.json({ success: true, message: 'Buffer de logs limpo' });
  } catch (error) {
    logger.error('Erro ao limpar logs', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para estatísticas de logs
router.get('/stats', (req, res) => {
  try {
    const logs = getSharedLogs(1000);
    const stats = {
      total: logs.length,
      byLevel: {},
      byService: {},
      lastHour: 0
    };
    
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    logs.forEach(log => {
      // Contar por nível
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Contar por serviço
      stats.byService[log.service] = (stats.byService[log.service] || 0) + 1;
      
      // Contar última hora
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.lastHour++;
      }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    logger.error('Erro ao obter estatísticas', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;