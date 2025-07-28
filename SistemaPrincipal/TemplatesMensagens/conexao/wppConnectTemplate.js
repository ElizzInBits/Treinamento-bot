// wppConnectTemplate.js

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://92.112.178.26:21465';
const SESSION = 'NERDWHATS_AMERICA'; // Sessão do wppconnect-server
const TOKEN = '$2b$10$ndo6.vqy0vzSkM_3IwYKQu6ZZRpI9bXl5wWn_vhw2nIJ92RtDQ.v2';

async function sendMessage(phone, endpoint, body = {}) {
  console.log('🚀 CHAMANDO API:', phone, endpoint, body);
  try {
    const payload = { phone, ...body };
    let response;

    if (body.path) {
      const form = new FormData();
      form.append('phone', phone);
      form.append('caption', body.caption || '');
      form.append('filename', body.filename || 'file');
      form.append('file', fs.createReadStream(path.resolve(body.path)));

      response = await axios.post(
        `${BASE_URL}/api/${SESSION}/${endpoint}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
    } else {
      response = await axios.post(
        `${BASE_URL}/api/${SESSION}/${endpoint}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${TOKEN}`,
          },
        }
      );
    }

    console.log('✅ SUCESSO NA API');
    return { success: true, data: response.data };
  } catch (err) {
    console.error('❌ ERRO NA API:', err.message);
    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

// Importar função de processamento
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../../BancoDeDados/database');

// ========================================
// INICIALIZAÇÃO DO BOT
// ========================================

async function start(client) {
    console.log('✅ Evento onMessage registrado com sucesso.');
    
    const { processarMensagem } = require('../Template2');
    
    client.onMessage((message) => {
        processarMensagem(message);
    });
}

// Conectar ao banco de dados
(async () => {
    await connectDB();
    await sequelize.sync();
})();

// Inicializar WPPConnect com sessão diferente para o bot
wppconnect.create({
    session: 'BOT_LISTENER', // Sessão diferente para o bot
    headless: 'new',
    executablePath: '/snap/bin/chromium',
    catchQR: (base64Qr, asciiQR) => {
        console.log('\n\n🤖 ========== QR CODE DO BOT ==========');
        console.log('📱 Escaneie este QR Code para conectar o BOT:');
        console.log(asciiQR);
        console.log('========================================\n');
    },
    statusFind: (status) => {
        console.log('🤖 [BOT] Status da sessão:', status);
    },
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
})
    .then((client) => {
        console.log('🤖 [BOT] Cliente conectado! Iniciando listener de mensagens...');
        start(client);
    })
    .catch((error) => {
        console.error('❌ [BOT] Erro ao iniciar WPPConnect:', error);
    });

module.exports = { sendMessage };