const { sendMessageWithSession } = require('./multi-session-api');

// Função sendMessage usando sistema de múltiplas sessões
async function sendMessage(phone, endpoint, body = {}, sessionName = null) {
    return await sendMessageWithSession(phone, endpoint, body, sessionName);
}

module.exports = { sendMessage };