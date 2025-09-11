const axios = require('axios');

const API_BASE = 'http://72.60.48.249:21465/api';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

// Configurar webhook para chamadas
async function setupCallBlocker() {
  try {
    const response = await axios.post(`${API_BASE}/${SESSION}/set-webhook-incoming-call`, {
      webhook: 'http://localhost:3000/webhook/call',
      enabled: true
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    console.log('✅ Webhook de chamadas configurado');
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
  }
}

// Bloquear chamada via API
async function blockCall(callId, from) {
  try {
    // Rejeitar chamada
    await axios.post(`${API_BASE}/${SESSION}/reject-call`, {
      callId: callId
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    // Enviar aviso
    await axios.post(`${API_BASE}/${SESSION}/send-message`, {
      phone: from.replace('@c.us', ''),
      message: '🚫 *Chamadas não são aceitas*\n\nEnvie mensagem de texto! 😊'
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
    
    console.log('✅ Chamada bloqueada e aviso enviado para:', from);
  } catch (error) {
    console.error('❌ Erro ao bloquear chamada:', error.message);
  }
}

module.exports = { setupCallBlocker, blockCall };