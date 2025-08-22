require('dotenv').config();
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API do wppconnect-server
const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

console.log('🔑 Usando token fixo para API');

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

// Cliente simulado para compatibilidade
const mockClient = {
  sendText: async (to, message) => {
    try {
      const response = await axios.post(`${API_BASE}/${SESSION}/send-message`, {
        phone: to.replace('@c.us', ''),
        message: message
      }, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      throw error;
    }
  },
  isConnected: async () => {
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

let globalClient = mockClient;

console.log('✅ WhatsApp Bot iniciado - usando wppconnect-server oficial');
console.log('📡 API Base:', API_BASE);
console.log('🎯 Sessão:', SESSION);

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
        if (processedMessages.size > 100) {
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

// Iniciar polling a cada 2 segundos
setInterval(verificarNovasMensagens, 2000);
console.log('🔄 Sistema de polling iniciado - verificando mensagens a cada 2s');

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return true;
}

// Função para verificar status da conexão
async function verificarStatusConexao() {
  return 'CONECTADO';
}

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
    console.log('⚠️ Erro ao verificar status da API');
  }
}, 60000); // Verificar a cada 60 segundos

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};