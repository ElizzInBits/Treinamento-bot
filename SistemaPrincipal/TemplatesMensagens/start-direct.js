const wppconnect = require('@wppconnect-team/wppconnect');
const { sendMessage } = require('./sendMessage-api');

console.log('🚀 Sistema de mensagens iniciado diretamente');

let directClient = null;

// Criar segunda sessão WhatsApp
wppconnect.create({
  session: 'WHATSAPP_BOT_DIRECT',
  headless: true,
  disableWelcome: true,
  updatesLog: false,
  autoClose: 0,
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  },
  catchQR: (base64Qr, asciiQR) => {
    console.log('\n📱 QR CODE Bot Direto:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Bot Direto Status:', status);
  }
}).then(c => {
  directClient = c;
  console.log('✅ Bot Direto conectado!');
}).catch(err => {
  console.error('❌ Erro Bot Direto:', err);
});

module.exports = { sendMessage, directClient };