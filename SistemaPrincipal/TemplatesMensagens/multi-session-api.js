const axios = require('axios');

// Configuração da API para múltiplas sessões
const API_BASE = 'http://72.60.48.249:21465/api';
const TOKEN = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

// Configuração das sessões disponíveis
const SESSIONS = {
    PRINCIPAL: 'NERDWHATS_AMERICA',
    SECUNDARIO: 'NERDWHATS_BACKUP',
    TERCEIRO: 'NERDWHATS_EXTRA'
};

// Função para enviar mensagem com sessão específica
async function sendMessageWithSession(phone, endpoint, body = {}, sessionName = 'PRINCIPAL') {
    const sendStart = Date.now();
    const phoneNumber = phone.replace('@c.us', '');
    const session = SESSIONS[sessionName] || SESSIONS.PRINCIPAL;
    
    try {
        let response;
        
        switch (endpoint) {
            case 'send-message':
                response = await axios.post(`${API_BASE}/${session}/send-message`, {
                    phone: phoneNumber,
                    message: body.message
                }, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` },
                    timeout: 3000
                });
                break;
                
            case 'send-list-message':
                response = await axios.post(`${API_BASE}/${session}/send-list-message`, {
                    phone: phoneNumber,
                    ...body
                }, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` },
                    timeout: 3000
                });
                break;
                
            case 'send-file':
                response = await axios.post(`${API_BASE}/${session}/send-file`, {
                    phone: phoneNumber,
                    path: body.path,
                    filename: body.filename,
                    caption: body.caption
                }, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` },
                    timeout: 5000
                });
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint} [${sessionName}]: ${Date.now() - sendStart}ms`);
        return response.data;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} [${sessionName}] (${duration}ms):`, error.message);
        return false;
    }
}

// Função para criar nova sessão
async function createSession(sessionName) {
    try {
        const response = await axios.post(`${API_BASE}/${sessionName}/start-session`, {}, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        console.log(`✅ Sessão ${sessionName} criada`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao criar sessão ${sessionName}:`, error.message);
        return false;
    }
}

// Função para verificar status das sessões
async function getSessionStatus(sessionName) {
    try {
        const response = await axios.get(`${API_BASE}/${sessionName}/status-session`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao verificar sessão ${sessionName}:`, error.message);
        return false;
    }
}

module.exports = { 
    sendMessageWithSession, 
    createSession, 
    getSessionStatus, 
    SESSIONS 
};