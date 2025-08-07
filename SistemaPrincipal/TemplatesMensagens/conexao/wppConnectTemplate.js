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
        if (body.path && body.path.endsWith('.gif')) {
          await clienteWpp.sendVideoAsGif(phoneFormatted, body.path, body.filename, body.caption || '');
        } else {
          await clienteWpp.sendFile(phoneFormatted, body.path, body.filename, body.caption || '');
        }
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

// Inicialização do WPPConnect desabilitada - usando start-template.js
// wppconnect.create(...) - DESABILITADO

module.exports = { sendMessage };