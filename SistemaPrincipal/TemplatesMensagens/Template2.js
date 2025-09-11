const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const ContatoModel = require('../BancoDeDados/models/contato');

// Inicializar modelo
let Contato = null;

// Cliente WhatsApp direto
let wppClient = null;

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    Contato = ContatoModel(sequelize);
    console.log('✅ Banco conectado - Template2');
  } catch (error) {
    console.error('❌ Erro no banco - Template2:', error);
  }
})();

// Função para processar mensagens
async function processarMensagem(message, client) {
  const telefone = message.from.replace('@c.us', '');
  const mensagem = message.body.trim();
  
  console.log(`💬 Processando: "${mensagem}" de ${telefone}`);
  
  try {
    // Verificar se o modelo está carregado
    if (!Contato) {
      console.log('⚠️ Modelo Contato não carregado, enviando resposta genérica');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    // Buscar contato no banco
    let contato = await Contato.findOne({ where: { telefone } });
    
    if (!contato) {
      // Resposta para contatos não cadastrados
      await client.sendText(message.from, '😊 Olá! Para utilizar nossos treinamentos, você precisa estar cadastrado.\n\nEntre em contato com nossa equipe para se cadastrar!');
      return;
    }
    
    // Resposta simples para contatos cadastrados
    if (mensagem.toLowerCase().includes('oi') || mensagem.toLowerCase().includes('olá')) {
      await client.sendText(message.from, `😊 Olá ${contato.nome}! Como posso ajudar você hoje?`);
    } else {
      await client.sendText(message.from, `💬 Olá ${contato.nome}! Recebi sua mensagem: "${mensagem}"\n\nEm breve nossa equipe entrará em contato!`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await client.sendText(message.from, '❌ Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
  }
}

// Função para definir cliente
function setWppClient(client) {
    wppClient = client;
}

// Inicializar cliente WhatsApp direto
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
    console.log('\n📱 QR CODE Bot Cliente:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Bot Cliente Status:', status);
  }
}).then(c => {
  wppClient = c;
  setWppClient(c);
  console.log('✅ Bot Cliente conectado!');
  
  // Listener de mensagens
  c.onMessage(async (message) => {
    if (!message.body) return;
    if (message.isGroupMsg) return;
    if (message.fromMe) return;
    
    console.log('📨 Mensagem recebida:', message.body, 'de:', message.from);
    
    try {
      await processarMensagem(message, c);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
    }
  });
  
  // Bloqueador de chamadas
  c.onIncomingCall(async (call) => {
    console.log('📞 Chamada recebida de:', call.peerJid);
    try {
      await c.rejectCall(call.id);
      await c.sendText(call.peerJid, '🚫 *Chamadas não são aceitas*\n\nEnvie mensagem de texto! 😊');
      console.log('✅ Chamada bloqueada');
    } catch (error) {
      console.error('❌ Erro ao bloquear:', error.message);
    }
  });
  
}).catch(err => {
  console.error('❌ Erro Bot Cliente:', err);
});

// Função sendMessage usando cliente direto
async function sendMessage(phone, endpoint, body = {}) {
    const sendStart = Date.now();
    
    if (!wppClient) {
        console.error('❌ Cliente WhatsApp não definido');
        return false;
    }
    
    try {
        let result;
        
        switch (endpoint) {
            case 'send-message':
                result = await wppClient.sendText(phone, body.message);
                break;
                
            case 'send-list-message':
                result = await wppClient.sendListMessage(phone, body);
                break;
                
            case 'send-file':
                result = await wppClient.sendFile(phone, body.path, body.filename, body.caption);
                break;
                
            case 'send-image':
                result = await wppClient.sendImage(phone, body.path, body.filename || 'image.png', body.caption || '');
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint}: ${Date.now() - sendStart}ms`);
        return result;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} (${duration}ms):`, error.message);
        return false;
    }
}

module.exports = { sendMessage, setWppClient, processarMensagem };