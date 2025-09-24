const axios = require('axios');

// Configuração da API para múltiplas sessões
const API_HOST = 'http://127.0.0.1:21465';
const SECRET_KEY = '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu';

// Configuração das sessões disponíveis
const SESSIONS = {
    PRINCIPAL: 'NERDWHATS_AMERICA',
    SECUNDARIO: 'NERDWHATS_BACKUP',
    TERCEIRO: 'NERDWHATS_EXTRA',
    QUARTO: 'NERDWHATS_DEVICE4',
    QUINTO: 'NERDWHATS_DEVICE5'
};

// Status das sessões
const sessionStatus = {
    PRINCIPAL: { connected: false, lastCheck: null },
    SECUNDARIO: { connected: false, lastCheck: null },
    TERCEIRO: { connected: false, lastCheck: null },
    QUARTO: { connected: false, lastCheck: null },
    QUINTO: { connected: false, lastCheck: null }
};

// Função para obter sessão disponível automaticamente
function getAvailableSession() {
    const connectedSessions = Object.keys(sessionStatus).filter(session => 
        sessionStatus[session].connected
    );
    
    if (connectedSessions.length === 0) return 'PRINCIPAL';
    
    // Rotacionar entre sessões conectadas
    const randomIndex = Math.floor(Math.random() * connectedSessions.length);
    return connectedSessions[randomIndex];
}

// Função para enviar mensagem com sessão específica ou automática
async function sendMessageWithSession(phone, endpoint, body = {}, sessionName = null) {
    const sendStart = Date.now();
    const phoneNumber = phone.replace('@c.us', '');
    
    // Se não especificou sessão, usar uma disponível
    if (!sessionName) {
        sessionName = getAvailableSession();
    }
    
    const session = SESSIONS[sessionName] || SESSIONS.PRINCIPAL;
    
    try {
        let response;
        
        switch (endpoint) {
            case 'send-message':
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${session}/send-message`, {
                    phone: phoneNumber,
                    message: body.message
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 3000
                });
                break;
                
            case 'send-list-message':
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${session}/send-list-message`, {
                    phone: phoneNumber,
                    ...body
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 3000
                });
                break;
                
            case 'send-file':
                response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${session}/send-file`, {
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
        
        console.log(`✅ ${endpoint} [${sessionName}]: ${Date.now() - sendStart}ms`);
        return response.data;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} [${sessionName}] (${duration}ms):`, error.message);
        
        // Marcar sessão como desconectada em caso de erro
        sessionStatus[sessionName].connected = false;
        
        // Tentar com outra sessão se disponível
        if (!sessionName || sessionName === getAvailableSession()) {
            const fallbackSession = getAvailableSession();
            if (fallbackSession !== sessionName) {
                console.log(`🔄 Tentando com sessão ${fallbackSession}`);
                return await sendMessageWithSession(phone, endpoint, body, fallbackSession);
            }
        }
        
        return false;
    }
}

// Função para criar nova sessão
async function createSession(sessionName) {
    const session = SESSIONS[sessionName];
    if (!session) {
        console.error(`❌ Sessão ${sessionName} não encontrada`);
        return false;
    }
    
    try {
        const response = await axios.post(`${API_HOST}/api/${SECRET_KEY}/${session}/start-session`, {}, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
        });
        console.log(`✅ Sessão ${sessionName} (${session}) criada`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao criar sessão ${sessionName}:`, error.message);
        return false;
    }
}

// Função para verificar status de uma sessão
async function getSessionStatus(sessionName) {
    const session = SESSIONS[sessionName];
    if (!session) return false;
    
    try {
        const response = await axios.get(`${API_HOST}/api/${SECRET_KEY}/${session}/status-session`, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        
        const isConnected = response.data && response.data.status === 'CONNECTED';
        sessionStatus[sessionName].connected = isConnected;
        sessionStatus[sessionName].lastCheck = new Date();
        
        return response.data;
    } catch (error) {
        sessionStatus[sessionName].connected = false;
        sessionStatus[sessionName].lastCheck = new Date();
        return false;
    }
}

// Função para verificar status de todas as sessões
async function checkAllSessions() {
    const results = {};
    
    for (const sessionName of Object.keys(SESSIONS)) {
        const status = await getSessionStatus(sessionName);
        results[sessionName] = {
            session: SESSIONS[sessionName],
            status: status,
            connected: sessionStatus[sessionName].connected
        };
    }
    
    return results;
}

// Função para obter QR Code de uma sessão
async function getSessionQR(sessionName) {
    const session = SESSIONS[sessionName];
    if (!session) return false;
    
    try {
        const response = await axios.get(`${API_HOST}/api/${SECRET_KEY}/${session}/qr-code`, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao obter QR da sessão ${sessionName}:`, error.message);
        return false;
    }
}

// Função para fechar uma sessão
async function closeSession(sessionName) {
    const session = SESSIONS[sessionName];
    if (!session) return false;
    
    try {
        const response = await axios.delete(`${API_HOST}/api/${SECRET_KEY}/${session}/close-session`, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        sessionStatus[sessionName].connected = false;
        console.log(`✅ Sessão ${sessionName} fechada`);
        return response.data;
    } catch (error) {
        console.error(`❌ Erro ao fechar sessão ${sessionName}:`, error.message);
        return false;
    }
}

module.exports = { 
    sendMessageWithSession, 
    createSession, 
    getSessionStatus,
    checkAllSessions,
    getSessionQR,
    closeSession,
    getAvailableSession,
    SESSIONS,
    sessionStatus
};