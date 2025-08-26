require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem, setWppClient } = require('./Template2');
const cacheContatos = require('../BancoDeDados/cache-contatos');

console.log('🚀 Iniciando WhatsApp Bot com conexão direta');

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco conectado - Template');
    
    // Pré-carregar contatos
    await cacheContatos.precarregarContatosAtivos();
  } catch (error) {
    console.error('❌ Erro no banco:', error);
  }
})();

// Inicializar cliente WhatsApp
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
    console.log('\n📱 QR CODE WhatsApp Bot:');
    console.log(asciiQR);
    console.log('📱 Escaneie o QR Code acima com seu WhatsApp');
  },
  statusFind: (status) => {
    console.log('📶 Status WhatsApp Bot:', status);
    if (status === 'qrReadSuccess') {
      console.log('✅ QR Code escaneado com sucesso!');
    }
    if (status === 'inChat') {
      console.log('✅ WhatsApp Bot CONECTADO e PRONTO!');
    }
  }
}).then(client => {
  console.log('✅ WhatsApp Bot conectado diretamente!');
  
  // Definir cliente no Template2
  setWppClient(client);
  
  // Escutar mensagens
  client.onMessage(async (message) => {
    if (message.isGroupMsg) return;
    if (message.fromMe) return;
    if (!message.body && !message.selectedRowId) return;
    
    console.log(`📨 Mensagem recebida diretamente: ${message.body || message.selectedRowId}`);
    
    try {
      await processarMensagem(message, client);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
    }
  });
  
}).catch(err => {
  console.error('❌ Erro WhatsApp Bot:', err);
});

console.log('⚡ Bot iniciado - aguardando conexão...');