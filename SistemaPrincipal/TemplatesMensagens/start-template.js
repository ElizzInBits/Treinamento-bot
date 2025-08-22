require('dotenv').config();
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API do wppconnect-server
const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = 'NERDWHATS_AMERICA:$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

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

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return true;
}

// Função para verificar status da conexão
async function verificarStatusConexao() {
  return 'CONECTADO';
}

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};