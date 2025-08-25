const axios = require('axios');

const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

async function testarAPI() {
  console.log('🧪 Testando API do wppconnect-server...');
  
  try {
    // Testar status
    console.log('1. Testando status da sessão...');
    const statusResponse = await axios.get(`${API_BASE}/${SESSION}/status-session`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: 5000
    });
    
    console.log('✅ Status:', statusResponse.data);
    
    // Testar envio de mensagem (substitua pelo seu número)
    const numeroTeste = '5511999999999'; // SUBSTITUA pelo seu número
    
    console.log('2. Testando envio de mensagem...');
    const sendResponse = await axios.post(`${API_BASE}/${SESSION}/send-message`, {
      phone: numeroTeste,
      message: '🧪 Teste de API - Bot funcionando!'
    }, {
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      timeout: 10000
    });
    
    console.log('✅ Mensagem enviada:', sendResponse.data);
    
    console.log('🎉 API funcionando perfeitamente!');
    
  } catch (error) {
    console.error('❌ Erro na API:', error.message);
    if (error.response) {
      console.error('📄 Resposta:', error.response.data);
    }
  }
}

testarAPI();