const SecurityUtils = require('./security');

class Logger {
    static levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    static currentLevel = Logger.levels.INFO;

    static log(level, message, data = null) {
        if (Logger.levels[level] > Logger.currentLevel) return;
        
        const timestamp = new Date().toISOString();
        const sanitizedMessage = SecurityUtils.sanitizeLog(message);
        const sanitizedData = data ? SecurityUtils.sanitizeLog(JSON.stringify(data)) : '';
        
        console.log(`[${timestamp}] ${level}: ${sanitizedMessage} ${sanitizedData}`);
    }

    static error(message, data) { Logger.log('ERROR', message, data); }
    static warn(message, data) { Logger.log('WARN', message, data); }
    static info(message, data) { Logger.log('INFO', message, data); }
    static debug(message, data) { Logger.log('DEBUG', message, data); }

    static setLevel(level) {
        if (Logger.levels[level] !== undefined) {
            Logger.currentLevel = Logger.levels[level];
        }
    }
}

module.exports = Logger;