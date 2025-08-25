const axios = require('axios');

const API_BASE = 'http://127.0.0.1:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

async function testeFinal() {
  console.log('🧪 Teste final da API...');
  
  try {
    // Teste envio
    const response = await axios.post(`${API_BASE}/${SESSION}/send-message`, {
      phone: '5533999595511',
      message: '🚀 Bot funcionando via API!'
    }, {
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 3000
    });
    
    console.log('✅ Mensagem enviada!', response.data);
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testeFinal();