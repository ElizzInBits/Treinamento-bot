const axios = require('axios');

const API_BASE = 'http://127.0.0.1:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

async function testarRotas() {
  console.log('🧪 Testando rotas da API...');
  
  const rotas = [
    `${API_BASE}/${SESSION}/status`,
    `${API_BASE}/${SESSION}/status-session`,
    `${API_BASE}/${SESSION}/check-connection-session`,
    `${API_BASE}/${SESSION}/all-chats-new-msg`,
    `${API_BASE}/${SESSION}/all-unread-messages`
  ];
  
  for (const rota of rotas) {
    try {
      console.log(`\n🔍 Testando: ${rota}`);
      const response = await axios.get(rota, {
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        timeout: 3000
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📄 Dados:`, JSON.stringify(response.data).substring(0, 200));
      
    } catch (error) {
      console.log(`❌ Erro: ${error.response?.status || error.message}`);
    }
  }
}

testarRotas();