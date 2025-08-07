const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

module.exports = {
  // Configurações do WPPConnect
  wppconnect: {
    session: 'NERDWHATS_AMERICA',
    headless: true,
    devtools: false,
    useChrome: true,
    debug: false,
    logQR: true,
    disableSpins: true,
    disableWelcome: true,
    updatesLog: false,
    autoClose: 120000,
    createPathFileToken: true,
    waitForLogin: true,
    logQR: true,
    disableSpins: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox', 
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  },

  // Configurações do banco de dados
  database: {
    name: process.env.DB_NAME || 'listadecontatos',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'admin!?',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306
  },

  // Configurações da API
  api: {
    baseUrl: 'http://92.112.178.26:21465',
    token: '$2b$10$.Ju_UkS.sNiPS4Cm77VFuuFTwe7x3ByR5G4s5BIfkcOX.8gnyphVi'
  },

  // Configurações de mídia
  media: {
    path: './media/',
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf']
  },

  // Mensagens do sistema
  messages: {
    welcome: '👋 Olá! Digite *oi* para ver as opções disponíveis.',
    unauthorized: '❌ Número não autorizado.',
    error: '⚠️ Ocorreu um erro. Tente novamente mais tarde.'
  }
};