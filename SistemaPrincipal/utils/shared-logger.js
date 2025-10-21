const fs = require('fs');
const path = require('path');
const { createServiceLogger } = require('./winston-logger');

const SHARED_LOGS_FILE = path.join(__dirname, '../logs/shared-logs.json');
const MAX_SHARED_LOGS = 1000;

// Função para adicionar log ao arquivo compartilhado
function addSharedLog(level, message, meta = {}) {
  try {
    let logs = [];
    
    // Ler logs existentes
    if (fs.existsSync(SHARED_LOGS_FILE)) {
      const data = fs.readFileSync(SHARED_LOGS_FILE, 'utf8');
      logs = JSON.parse(data);
    }
    
    // Adicionar novo log
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level,
      message: message,
      service: meta.service || 'system',
      ...meta
    };
    
    logs.push(logEntry);
    
    // Manter apenas os últimos logs
    if (logs.length > MAX_SHARED_LOGS) {
      logs = logs.slice(-MAX_SHARED_LOGS);
    }
    
    // Salvar de volta
    fs.writeFileSync(SHARED_LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Erro ao salvar log compartilhado:', error.message);
  }
}

// Função para ler logs compartilhados
function getSharedLogs(limit = 100, level = null) {
  try {
    if (!fs.existsSync(SHARED_LOGS_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(SHARED_LOGS_FILE, 'utf8');
    let logs = JSON.parse(data);
    
    // Filtrar por nível se especificado
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    // Retornar os últimos logs em ordem reversa
    return logs.slice(-limit).reverse();
  } catch (error) {
    console.error('Erro ao ler logs compartilhados:', error.message);
    return [];
  }
}

// Função para limpar logs compartilhados
function clearSharedLogs() {
  try {
    if (fs.existsSync(SHARED_LOGS_FILE)) {
      fs.unlinkSync(SHARED_LOGS_FILE);
    }
  } catch (error) {
    console.error('Erro ao limpar logs compartilhados:', error.message);
  }
}

// Criar logger que salva em arquivo compartilhado
function createSharedLogger(serviceName) {
  const logger = createServiceLogger(serviceName);
  
  // Sobrescrever métodos para salvar também no arquivo compartilhado
  const originalInfo = logger.info;
  const originalWarn = logger.warn;
  const originalError = logger.error;
  const originalDebug = logger.debug;
  
  logger.info = function(message, meta = {}) {
    addSharedLog('info', message, { ...meta, service: serviceName });
    return originalInfo.call(this, message, meta);
  };
  
  logger.warn = function(message, meta = {}) {
    addSharedLog('warn', message, { ...meta, service: serviceName });
    return originalWarn.call(this, message, meta);
  };
  
  logger.error = function(message, meta = {}) {
    addSharedLog('error', message, { ...meta, service: serviceName });
    return originalError.call(this, message, meta);
  };
  
  logger.debug = function(message, meta = {}) {
    addSharedLog('debug', message, { ...meta, service: serviceName });
    return originalDebug.call(this, message, meta);
  };
  
  return logger;
}

module.exports = {
  createSharedLogger,
  getSharedLogs,
  clearSharedLogs,
  addSharedLog
};