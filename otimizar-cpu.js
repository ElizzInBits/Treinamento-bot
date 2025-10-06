const wppconnect = require('@wppconnect-team/wppconnect');

// Configurações otimizadas para reduzir uso de CPU
const puppeteerOptions = {
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-web-security',
    '--single-process',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-networking',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-component-update',
    '--disable-field-trial-config',
    '--disable-hang-monitor',
    '--disable-infobars',
    '--disable-ipc-flooding-protection',
    '--disable-popup-blocking',
    '--disable-prompt-on-repost',
    '--disable-renderer-backgrounding',
    '--disable-search-engine-choice-screen',
    '--disable-sync',
    '--disable-features=Translate,AcceptCHFrame,MediaRouter,OptimizationHints',
    '--memory-pressure-off',
    '--max_old_space_size=512'
  ],
  protocolTimeout: 300000,
  slowMo: 100, // Adicionar delay entre ações
  defaultViewport: { width: 800, height: 600 }
};

module.exports = { puppeteerOptions };