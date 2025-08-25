require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API do wppconnect-server (backup)
const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

// Cliente direto do WhatsApp
let globalClient = null;

console.log('🚀 Iniciando WhatsApp Bot com conexão direta + API backup');

console.log('🚀 Iniciando WhatsApp Bot com API do wppconnect-server...');

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

// Cliente híbrido (direto + API backup)
const hybridClient = {
  sendText: async (to, message) => {
    // Timeout para conexão direta
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout cliente direto')), 5000);
    });
    
    // Tentar conexão direta primeiro com timeout
    if (globalClient && globalClient.sendText) {
      try {
        const result = await Promise.race([
          globalClient.sendText(to, message),
          timeoutPromise
        ]);
        return result;
      } catch (error) {
        console.log('⚠️ Conexão direta falhou/timeout, usando API backup');
      }
    }
    
    // Usar API backup com timeout
    try {
      const response = await axios.post(`${API_BASE}/${SESSION}/send-message`, {
        phone: to.replace('@c.us', ''),
        message: message
      }, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        },
        timeout: 8000
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      throw error;
    }
  },
  isConnected: async () => {
    if (globalClient && globalClient.isConnected) {
      try {
        return await globalClient.isConnected();
      } catch (error) {
        // Continuar para API backup
      }
    }
    
    try {
      const response = await axios.get(`${API_BASE}/${SESSION}/status-session`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      return response.data.status === 'CONNECTED' || response.data.state === 'CONNECTED';
    } catch (error) {
      return false;
    }
  }
};

// Inicializar conexão direta do WhatsApp
async function inicializarWhatsApp() {
  try {
    globalClient = await wppconnect.create({
      session: 'WHATSAPP_BOT_DIRECT',
      headless: true,
      disableWelcome: true,
      updatesLog: false,
      autoClose: 0,
      browserWS: '',
      disableSpins: true,
      logQR: false,
      puppeteerOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--disable-extensions'
        ],
        timeout: 30000
      },
      catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('\n📱 QR CODE WhatsApp Bot:');
        console.log(asciiQR);
        console.log('\n🔗 QR Code URL:', urlCode);
        console.log('📱 Escaneie o QR Code acima com seu WhatsApp');
        console.log('🔄 Tentativa:', attempts);
      },
      statusFind: (status) => {
        console.log('📶 Status WhatsApp Bot:', status);
        if (status === 'inChat') {
          console.log('✅ WhatsApp Bot CONECTADO e PRONTO!');
        }
        if (status === 'qrReadSuccess') {
          console.log('✅ QR Code escaneado com sucesso!');
        }
        if (status === 'chatsAvailable') {
          console.log('✅ Chats carregados - Bot operacional!');
        }
      }
    });
    
    console.log('✅ WhatsApp Bot conectado diretamente!');
    
    // Listener de mensagens
    globalClient.onMessage((message) => {
      if (!message.body && !message.selectedRowId) return;
      if (message.isGroupMsg) return;
      if (message.fromMe) return;
      
      console.log('📨 Mensagem recebida diretamente:', message.body);
      
      // Processar mensagem
      processarMensagem(message, globalClient).catch(err => {
        console.error('❌ Erro ao processar:', err.message);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro na conexão direta:', error.message);
    console.log('🔄 Usando apenas API do wppconnect-server como backup');
  }
}

// Inicializar
inicializarWhatsApp();

console.log('📡 API Backup:', API_BASE);
console.log('🎯 Sessão Backup:', SESSION);

// Sistema de polling para receber mensagens
let ultimaVerificacao = Date.now();
const processedMessages = new Set();

async function verificarNovasMensagens() {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/all-unread-messages`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    if (response.data && response.data.length > 0) {
      for (const message of response.data) {
        if (!message.body && !message.selectedRowId) continue;
        if (message.isGroupMsg) continue;
        if (message.fromMe) continue; // Ignorar mensagens próprias
        
        const msgId = `${message.from}_${message.timestamp}`;
        if (processedMessages.has(msgId)) continue;
        processedMessages.add(msgId);
        
        // Limpar cache se ficar muito grande
        if (processedMessages.size > 50) {
          processedMessages.clear();
        }
        
        console.log('📨 Nova mensagem recebida de', message.from, ':', message.body || message.selectedRowId);
        
        // Processar mensagem
        processarMensagem(message, globalClient).catch(err => {
          console.error('❌ Erro ao processar mensagem:', err.message);
        });
      }
    }
  } catch (error) {
    // Ignorar erros de polling silenciosamente
  }
}

// Iniciar polling a cada 1 segundo
setInterval(verificarNovasMensagens, 1000);
console.log('🔄 Sistema de polling iniciado - verificando mensagens a cada 1s');

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return globalClient !== null;
}

// Função para verificar status da conexão
async function verificarStatusConexao() {
  return await hybridClient.isConnected() ? 'CONECTADO' : 'DESCONECTADO';
}

// Exportar cliente híbrido
module.exports = { 
  getClient: () => globalClient || hybridClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};

// Verificar status da API periodicamente
setInterval(async () => {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/status-session`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    if (response.data.status !== 'CONNECTED') {
      console.log('⚠️ Status da sessão:', response.data.status);
    }
  } catch (error) {
    // API indisponível - usando conexão direta
  }
}, 30000); // Verificar a cada 30 segundos

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};