const axios = require('axios');

// Configuração da API
const API_HOST = 'http://127.0.0.1:21465';
const SESSION = 'NERDWHATS_AMERICA';
const SECRET_KEY = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

// Função sendMessage usando APENAS a API
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
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${SESSION}/send-file`, {
                    phone: phoneNumber,
                    path: body.path,
                    filename: body.filename,
                    caption: body.caption
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                });
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint}: ${Date.now() - sendStart}ms`);
        return response.data;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} (${duration}ms):`, error.message);
        return false;
    }
}

module.exports = { sendMessage };