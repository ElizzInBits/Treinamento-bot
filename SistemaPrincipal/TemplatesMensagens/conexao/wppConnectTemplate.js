// wppConnectTemplate.js

const path = require('path');
const fs = require('fs');

let clienteWpp = null;

async function sendMessage(phone, endpoint, body = {}) {
  if (!clienteWpp) {
    console.error('❌ Cliente WPP não conectado');
    return { success: false, error: 'Cliente não conectado' };
  }

  try {
    const phoneFormatted = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    
    switch (endpoint) {
      case 'send-message':
        await clienteWpp.sendText(phoneFormatted, body.message);
        break;
      case 'send-list-message':
        await clienteWpp.sendListMessage(phoneFormatted, body);
        break;
      case 'send-file':
        await clienteWpp.sendFile(phoneFormatted, body.path, body.filename, body.caption || '');
        break;
      case 'send-sticker-gif':
        await clienteWpp.sendImageAsSticker(phoneFormatted, body.path);
        break;
      default:
        throw new Error(`Endpoint ${endpoint} não suportado`);
    }
    
    return { success: true };
  } catch (err) {
    console.error('❌ ERRO AO ENVIAR:', err.message);
    return { success: false, error: err.message };
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
    clienteWpp = client; // Salvar referência global
    
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

let qrMostrado = false;

// Inicializar WPPConnect com sessão diferente para o bot
wppconnect.create({
    session: 'BOT_LISTENER',
    headless: 'new', 
    executablePath: '/snap/bin/chromium',
    catchQR: (base64Qr, asciiQR) => {
        if (!qrMostrado) {
            console.clear();
            console.log('\n🤖 ========== QR CODE DO BOT ==========');
            console.log('📱 Escaneie este QR Code para conectar o BOT:');
            console.log(asciiQR);
            console.log('========================================\n');
            qrMostrado = true;
        }
    },
    statusFind: (status) => {
        if (status === 'authenticated') {
            console.log('🤖 [BOT] ✅ Conectado com sucesso!');
        } else if (status === 'qrReadSuccess') {
            console.log('🤖 [BOT] QR Code lido, aguardando autenticação...');
        }
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