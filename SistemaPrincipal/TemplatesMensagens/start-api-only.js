require('dotenv').config();
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API
const API_BASE = 'http://127.0.0.1:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

console.log('🚀 Bot usando APENAS API do wppconnect-server');

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco conectado');
  } catch (error) {
    console.error('❌ Erro no banco:', error);
  }
})();

// Verificar status da API
async function verificarAPI() {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/status`, {
      timeout: 2000
    });
    
    const connected = response.data.connected;
    console.log('📶 Status API:', connected ? 'CONECTADO' : 'DESCONECTADO');
    return connected === true;
  } catch (error) {
    console.error('❌ API indisponível:', error.message);
    return false;
  }
}

// Polling de mensagens
const processedMessages = new Set();

async function buscarMensagens() {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/all-unread-messages`, {
      timeout: 1500
    });
    
    if (response.data && response.data.length > 0) {
      console.log(`📨 ${response.data.length} mensagens não lidas`);
      
      for (const message of response.data) {
        if (!message.body && !message.selectedRowId) continue;
        if (message.isGroupMsg) continue;
        if (message.fromMe) continue;
        
        const msgId = `${message.from}_${message.timestamp}`;
        if (processedMessages.has(msgId)) continue;
        
        processedMessages.add(msgId);
        
        // Limpar cache
        if (processedMessages.size > 50) {
          processedMessages.clear();
        }
        
        console.log(`📨 ${message.from}: ${message.body || message.selectedRowId}`);
        
        // Processar mensagem
        processarMensagem(message).catch(err => {
          console.error('❌ Erro processamento:', err.message);
        });
      }
    }
  } catch (error) {
    // Ignorar erros de polling
  }
}

// Inicializar
async function iniciar() {
  console.log('🔍 Verificando API...');
  
  const apiOk = await verificarAPI();
  if (apiOk) {
    console.log('✅ API conectada!');
  } else {
    console.log('⚠️ API não conectada, continuando...');
  }
  
  // Polling a cada 800ms
  setInterval(buscarMensagens, 800);
  console.log('🔄 Polling iniciado - 800ms');
  
  // Verificar status a cada 30s
  setInterval(verificarAPI, 30000);
}

iniciar();

console.log('📡 API:', API_BASE);
console.log('🎯 Sessão:', SESSION);
console.log('⚡ Bot pronto - usando apenas API!');