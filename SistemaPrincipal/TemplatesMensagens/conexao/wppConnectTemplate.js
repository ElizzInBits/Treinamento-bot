// wppConnectTemplate.js

const axios = require('axios');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://92.112.178.26:21465';
const SESSION = 'NERDWHATS_AMERICA';
const TOKEN = '$2b$10$ndo6.vqy0vzSkM_3IwYKQu6ZZRpI9bXl5wWn_vhw2nIJ92RtDQ.v2'; 

async function sendMessage(phone, endpoint, body = {}) {
  console.log('🚀 CHAMANDO API:', phone, endpoint, body);
  try {
    const payload = { phone, ...body };
    let response;

    if (body.path) {
      // Enviando arquivo via path com FormData
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
      // Enviando texto, localização etc.
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
const { processarMensagem } = require('../Template2');
const { connectDB, sequelize } = require('../../BancoDeDados/database');

// ========================================
// INICIALIZAÇÃO DO BOT
// ========================================

async function start(client) {
    console.log('✅ Evento onMessage registrado com sucesso.');
    client.onMessage(processarMensagem);
}

// Conectar ao banco de dados
(async () => {
    await connectDB();
    await sequelize.sync();
})();



// Inicializar WPPConnect
wppconnect.create({
    session: 'NERDWHATS_AMERICA',
    headless: 'new',
    executablePath: '/snap/bin/chromium',
    catchQR: (base64Qr, asciiQR) => {
        console.clear();
        console.log('=-=-=-==-==-=-==-=-==-==-=');
        console.log('QR CODE DO BOT ABAIXO');
        console.log('=-=-=-==-==-=-==-=-==-==-=');
        console.log('📱 Escaneie o QR Code abaixo com seu WhatsApp:');
        console.log(asciiQR);
    },
    statusFind: (status) => {
        console.log('📶 Status da sessão:', status);
    },
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
})
    .then((client) => {
        console.log('🟢 Cliente conectado! Iniciando listener de mensagens...');
        start(client);
    })
    .catch((error) => {
        console.error('❌ Erro ao iniciar WPPConnect:', error);
    });

module.exports = { sendMessage };