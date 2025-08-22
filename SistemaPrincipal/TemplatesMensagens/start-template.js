require('dotenv').config();
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API do wppconnect-server
const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

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
      const response = await axios.post(`${API_BASE}/${SESSION}/${TOKEN}/send-message`, {
        phone: to.replace('@c.us', ''),
        message: message
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.message);
      throw error;
    }
  },
  isConnected: async () => {
    try {
      const response = await axios.get(`${API_BASE}/${SESSION}/${TOKEN}/status`);
      return response.data.status === 'connected';
    } catch (error) {
      return false;
    }
  }
};

let globalClient = mockClient;

// Verificar status da sessão
async function verificarStatus() {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/${TOKEN}/status`);
    console.log('📶 Status da sessão:', response.data.status);
    return response.data.status;
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
    return 'error';
  }
}

// Inicializar sessão se necessário
async function inicializarSessao() {
  const status = await verificarStatus();
  
  if (status === 'disconnected') {
    console.log('🔄 Iniciando nova sessão...');
    try {
      await axios.post(`${API_BASE}/${SESSION}/${TOKEN}/start-session`);
      console.log('✅ Sessão iniciada - verifique os logs do wppconnect-server para o QR Code');
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão:', error.message);
    }
  } else if (status === 'connected') {
    console.log('✅ Sessão já conectada!');
  }
}

// Inicializar
inicializarSessao();

// Verificar status periodicamente
setInterval(async () => {
  const status = await verificarStatus();
  if (status === 'disconnected') {
    console.log('⚠️ Sessão desconectada - tentando reconectar...');
    await inicializarSessao();
  }
}, 30000); // Verificar a cada 30 segundos

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return true; // Sempre retorna true pois usa API
}

// Função para verificar status da conexão
async function verificarStatusConexao() {
  const status = await verificarStatus();
  return status === 'connected' ? 'CONECTADO' : 'DESCONECTADO';
}

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};