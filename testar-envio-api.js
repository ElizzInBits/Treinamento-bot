const axios = require('axios');

const API_BASE = 'http://127.0.0.1:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

async function testarEnvio() {
  console.log('🧪 Testando envio de mensagem...');
  
  const endpoints = [
    'send-text',
    'send-message', 
    'sendText',
    'send'
  ];
  
  const numeroTeste = '5511999999999'; // SUBSTITUA pelo seu número
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testando: ${API_BASE}/${SESSION}/${endpoint}`);
      
      const response = await axios.post(`${API_BASE}/${SESSION}/${endpoint}`, {
        phone: numeroTeste,
        message: `🧪 Teste ${endpoint} - ${new Date().toLocaleTimeString()}`
      }, {
        headers: { 
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 3000
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Resposta:`, response.data);
      break; // Se funcionou, parar
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
    }
  }
}

testarEnvio();