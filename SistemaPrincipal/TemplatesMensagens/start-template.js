require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Variável global para o cliente
let globalClient = null;

console.log('🚀 Iniciando Template Processor...');

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco conectado - Template');
  } catch (error) {
    console.error('❌ Erro no banco - Template:', error);
  }
})();

// Conectar ao WhatsApp
wppconnect.create({
  session: process.env.WHATSAPP_SESSION || 'NERDWHATS_AMERICA',
  headless: true,
  disableWelcome: true,
  updatesLog: false,
  autoClose: 0, // Não fechar automaticamente
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  catchQR: (base64Qr, asciiQR) => {
    console.log('\n📱 QR CODE:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Status:', status);
    if (status === 'isLogged') {
      console.log('✅ Sessão existente encontrada!');
    }
  }
}).then(client => {
  console.log('✅ Bot conectado!');
  globalClient = client;
  
  client.onMessage(async (message) => {
    try {
      await processarMensagem(message, client);
    } catch (error) {
      console.error('❌ Erro no processamento:', error);
    }
  });
}).catch(err => {
  console.error('❌ Erro ao conectar:', err);
});

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return globalClient && globalClient.isConnected;
}

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva
};