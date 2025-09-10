require('dotenv').config();
const axios = require('axios');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Configuração da API do wppconnect-server
const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

console.log('🚀 Iniciando WhatsApp Bot usando APENAS wppconnect-server');

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

// Verificar se servidor está ativo
async function verificarServidor() {
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/status-session`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: 3000
    });
    
    console.log('📶 Status da sessão:', response.data.status || response.data.state);
    return response.data.status === 'CONNECTED' || response.data.state === 'CONNECTED';
  } catch (error) {
    console.error('❌ Servidor wppconnect não disponível:', error.message);
    return false;
  }
}

// Sistema de polling otimizado
const processedMessages = new Set();
let isPolling = false;

async function verificarNovasMensagens() {
  if (isPolling) return;
  isPolling = true;
  
  try {
    const response = await axios.get(`${API_BASE}/${SESSION}/all-unread-messages`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: 2000
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
        
        // Limpar cache se muito grande
        if (processedMessages.size > 100) {
          const oldSize = processedMessages.size;
          processedMessages.clear();
          console.log(`🧹 Cache de mensagens limpo: ${oldSize} → 0`);
        }
        
        console.log(`📨 Nova mensagem de ${message.from}: ${message.body || message.selectedRowId}`);
        
        // Processar mensagem sem bloquear
        processarMensagem(message).catch(err => {
          console.error('❌ Erro ao processar:', err.message);
        });
      }
    }
  } catch (error) {
    // Ignorar erros de polling
    if (error.code !== 'ECONNABORTED') {
      console.error('⚠️ Erro no polling:', error.message);
    }
  } finally {
    isPolling = false;
  }
}

// Inicializar sistema
async function inicializar() {
  console.log('🔍 Verificando servidor wppconnect...');
  
  const servidorAtivo = await verificarServidor();
  if (!servidorAtivo) {
    console.log('⚠️ Servidor não conectado. Aguardando...');
  }
  
  // Iniciar polling
  setInterval(verificarNovasMensagens, 1000);
  console.log('🔄 Polling iniciado - verificando mensagens a cada 1s');
  
  // Verificar status periodicamente
  setInterval(verificarServidor, 30000);
}

// Inicializar
inicializar();

console.log('📡 API:', API_BASE);
console.log('🎯 Sessão:', SESSION);
console.log('✅ Bot pronto para receber mensagens via servidor!');