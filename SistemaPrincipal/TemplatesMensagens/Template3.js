const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const ContatoModel = require('../BancoDeDados/models/contato');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');

let Contato = null;
let wppClient = null;
let reconectando = false;

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    Contato = ContatoModel(sequelize);
    console.log('✅ Banco conectado - Template3');
  } catch (error) {
    console.error('❌ Erro no banco - Template3:', error);
  }
})();

// Função para processar mensagens
async function processarMensagem(message, client) {
  const telefone = message.from.replace('@c.us', '');
  const mensagem = message.body.trim();
  
  console.log(`💬 [Template3] Processando: "${mensagem}" de ${telefone}`);
  
  try {
    if (!Contato) {
      console.log('⚠️ Modelo Contato não carregado');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    const sendMessageForTraining = async (phone, endpoint, body) => {
      return await sendMessage(phone, endpoint, body);
    };
    
    const buscarContato = async () => {
      const formatosTelefone = [
        telefone,
        telefone.substring(2),
        `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
        telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
      ];
      
      for (const formato of formatosTelefone) {
        const contato = await Contato.findOne({ where: { telefone: formato } });
        if (contato) {
          console.log(`✅ Contato encontrado: ${contato.nome} (formato: ${formato})`);
          return contato;
        }
      }
      
      console.log(`❌ Contato não encontrado: ${telefone}`);
      return null;
    };
    
    await treinamentoApresentacao.processarRespostaApresentacao(telefone, mensagem, message.selectedRowId, null, sendMessageForTraining, buscarContato);
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await client.sendText(message.from, '❌ Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
  }
}

// Função para inicializar o bot
async function inicializarBot() {
  if (reconectando) {
    console.log('⏳ Reconexão já em andamento...');
    return;
  }
  
  reconectando = true;
  
  try {
    console.log('🚀 Iniciando Template3...');
    
    const client = await wppconnect.create({
      session: 'TEMPLATE3_SESSION',
      headless: true,
      disableWelcome: true,
      updatesLog: false,
      autoClose: 120000,
      qrTimeout: 120000,
      puppeteerOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security'
        ]
      },
      catchQR: (base64Qr, asciiQR) => {
        console.log('\n📱 QR CODE Template3:');
        console.log(asciiQR);
      },
      statusFind: (status) => {
        console.log('📶 Template3 Status:', status);
        
        if (status === 'browserClose' || status === 'disconnected') {
          console.log('🔄 Desconectado, reconectando em 10 segundos...');
          setTimeout(() => {
            reconectando = false;
            inicializarBot();
          }, 10000);
        }
      }
    });
    
    wppClient = client;
    reconectando = false;
    console.log('✅ Template3 conectado!');
    
    // Listener de mensagens
    client.onMessage(async (message) => {
      if (!message.body) return;
      if (message.isGroupMsg) return;
      if (message.fromMe) return;
      
      console.log('📨 Mensagem recebida:', message.body, 'de:', message.from);
      
      try {
        await processarMensagem(message, client);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    });
    
    // Bloqueador de chamadas
    client.onIncomingCall(async (call) => {
      console.log('📞 Chamada recebida de:', call.peerJid);
      try {
        await client.rejectCall(call.id);
        await client.sendText(call.peerJid, '🚫 *Chamadas não são aceitas*\n\nEnvie mensagem de texto! 😊');
      } catch (error) {
        console.error('❌ Erro ao bloquear chamada:', error.message);
      }
    });
    
  } catch (error) {
    console.error('❌ Erro Template3:', error);
    reconectando = false;
    console.log('🔄 Tentando reconectar em 15 segundos...');
    setTimeout(() => {
      inicializarBot();
    }, 15000);
  }
}

// Função sendMessage
async function sendMessage(phone, endpoint, body = {}) {
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
    
    console.log(`✅ ${endpoint} enviado`);
    return result;
    
  } catch (error) {
    console.error(`❌ ${endpoint}:`, error.message);
    return false;
  }
}

// Inicializar o bot
inicializarBot();

module.exports = { sendMessage, processarMensagem };