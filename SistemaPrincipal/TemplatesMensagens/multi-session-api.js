const axios = require('axios');

// Configuração da API
const API_HOST = 'http://127.0.0.1:21465';
const SECRET_KEY = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';
const SESSION = 'NERDWHATS_AMERICA';

// Função para enviar mensagem
async function sendMessage(phone, endpoint, body = {}) {
    const sendStart = Date.now();
    const phoneNumber = phone.replace('@c.us', '');
    
    try {
        let response;
        
        switch (endpoint) {
            case 'send-message':
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/send-message`, {
                    phone: phoneNumber,
                    message: body.message
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 3000
                });
                break;
                
            case 'send-list':
            case 'send-list-message':
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/send-list-message`, {
                    phone: phoneNumber,
                    ...body
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 3000
                });
                break;
                
            case 'send-file':
            case 'send-image':
            case 'send-video':
                // Verificar se o arquivo existe antes de tentar enviar
                const fs = require('fs');
                if (body.path && !fs.existsSync(body.path)) {
                    console.error(`❌ Arquivo não encontrado: ${body.path}`);
                    return false;
                }
                
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/send-file`, {
                    phone: phoneNumber,
                    path: body.path,
                    filename: body.filename,
                    caption: body.caption
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000 // Aumentar timeout para arquivos
                });
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint}: ${Date.now() - sendStart}ms`);
        return response.data;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        
        // Log mais detalhado para erros de mídia
        if (endpoint.includes('file') || endpoint.includes('video') || endpoint.includes('image')) {
            console.error(`❌ ${endpoint} (${duration}ms): ${error.message}`);
            if (error.response && error.response.data) {
                console.error(`   Detalhes:`, JSON.stringify(error.response.data));
            }
        } else {
            console.error(`❌ ${endpoint} (${duration}ms):`, error.message);
        }
        
        return false;
    }
}

// Função para criar sessão
async function createSession() {
    try {
        const response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/start-session`, {}, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log(`✅ Sessão ${SESSION} criada`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao criar sessão:`, error.message);
        return false;
    }
}

// Função para verificar status da sessão
async function getSessionStatus() {
    try {
        const response = await axios.get(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/status-session`, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        return false;
    }
}

// Função para obter QR Code
async function getSessionQR() {
    try {
        const response = await axios.get(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/qr-code`, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao obter QR:`, error.message);
        return false;
    }
}

// Função para fechar sessão
async function closeSession() {
    try {
        const response = await axios.delete(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/close-session`, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ Sessão fechada`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao fechar sessão:`, error.message);
        return false;
    }
}

module.exports = { 
    sendMessage, 
    createSession, 
    getSessionStatus,
    getSessionQR,
    closeSession
};