const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configuração de cores para console
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue'
};

winston.addColors(colors);

// Formato personalizado para logs estruturados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${service || 'SYSTEM'}] ${level}: ${message} ${metaStr}`;
  })
);

// Transports para rotação diária
const createRotateTransport = (filename, level = 'info') => {
  return new DailyRotateFile({
    filename: path.join(__dirname, '../logs', `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    level: level,
    format: logFormat
  });
};

// Criar logger principal
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'treinamento-bot' },
  transports: [
    // Console para desenvolvimento
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug'
    }),
    
    // Arquivos com rotação
    createRotateTransport('combined', 'info'),
    createRotateTransport('error', 'error'),
    createRotateTransport('debug', 'debug')
  ],
  
  // Tratamento de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/exceptions.log'),
      format: logFormat
    })
  ],
  
  // Tratamento de promises rejeitadas
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/rejections.log'),
      format: logFormat
    })
  ]
});

// Função para criar logger específico por serviço
const createServiceLogger = (serviceName) => {
  const serviceLogger = logger.child({ service: serviceName });
  
  // Sobrescrever métodos para garantir que o serviço seja correto
  const originalInfo = serviceLogger.info;
  const originalWarn = serviceLogger.warn;
  const originalError = serviceLogger.error;
  const originalDebug = serviceLogger.debug;
  
  serviceLogger.info = function(message, meta = {}) {
    addToBuffer('info', message, { ...meta, service: serviceName });
    return originalInfo.call(this, message, { ...meta, service: serviceName });
  };
  
  serviceLogger.warn = function(message, meta = {}) {
    addToBuffer('warn', message, { ...meta, service: serviceName });
    return originalWarn.call(this, message, { ...meta, service: serviceName });
  };
  
  serviceLogger.error = function(message, meta = {}) {
    addToBuffer('error', message, { ...meta, service: serviceName });
    return originalError.call(this, message, { ...meta, service: serviceName });
  };
  
  serviceLogger.debug = function(message, meta = {}) {
    addToBuffer('debug', message, { ...meta, service: serviceName });
    return originalDebug.call(this, message, { ...meta, service: serviceName });
  };
  
  return serviceLogger;
};

// Logs em tempo real para dashboard
const logBuffer = [];
const MAX_BUFFER_SIZE = 1000;

// Função para adicionar log ao buffer
const addToBuffer = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    service: meta.service || 'system',
    ...meta
  };
  
  logBuffer.push(logEntry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }
};

// Sobrescrever métodos do logger para capturar no buffer
const originalInfo = logger.info;
const originalWarn = logger.warn;
const originalError = logger.error;
const originalDebug = logger.debug;

logger.info = function(message, meta = {}) {
  addToBuffer('info', message, meta);
  return originalInfo.call(this, message, meta);
};

logger.warn = function(message, meta = {}) {
  addToBuffer('warn', message, meta);
  return originalWarn.call(this, message, meta);
};

logger.error = function(message, meta = {}) {
  addToBuffer('error', message, meta);
  return originalError.call(this, message, meta);
};

logger.debug = function(message, meta = {}) {
  addToBuffer('debug', message, meta);
  return originalDebug.call(this, message, meta);
};

// Função para obter logs recentes
const getRecentLogs = (limit = 100, level = null) => {
  let logs = logBuffer.slice(-limit);
  if (level) {
    logs = logs.filter(log => log.level === level);
  }
  return logs.reverse();
};

// Função para limpar logs antigos
const clearOldLogs = () => {
  logBuffer.length = 0;
  logger.info('Log buffer cleared', { action: 'clear_buffer' });
};

// Middleware para Express
const expressMiddleware = require('express-winston').logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { 
    return false; 
  }
});

module.exports = {
  logger,
  createServiceLogger,
  getRecentLogs,
  clearOldLogs,
  expressMiddleware
};