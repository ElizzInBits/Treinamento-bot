const { createSession, getSessionStatus, SESSIONS } = require('./multi-session-api');

class SessionManager {
    constructor() {
        this.activeSessions = new Set();
        this.sessionQueue = [];
    }

    // Inicializar todas as sessões
    async initAllSessions() {
        console.log('🔄 Inicializando todas as sessões...');
        
        for (const [name, sessionId] of Object.entries(SESSIONS)) {
            try {
                await this.initSession(name, sessionId);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda 5s entre sessões
            } catch (error) {
                console.error(`❌ Erro ao inicializar ${name}:`, error.message);
            }
        }
    }

    // Inicializar sessão específica
    async initSession(sessionName, sessionId) {
        console.log(`🔄 Inicializando sessão ${sessionName}...`);
        
        const status = await getSessionStatus(sessionId);
        
        if (!status || status.status !== 'CONNECTED') {
            const result = await createSession(sessionId);
            if (result) {
                console.log(`✅ Sessão ${sessionName} iniciada. Escaneie o QR Code.`);
                this.activeSessions.add(sessionName);
            }
        } else {
            console.log(`✅ Sessão ${sessionName} já conectada`);
            this.activeSessions.add(sessionName);
        }
    }

    // Obter sessão disponível
    getAvailableSession() {
        const sessions = Array.from(this.activeSessions);
        if (sessions.length === 0) return 'PRINCIPAL';
        
        // Rotacionar entre sessões disponíveis
        const session = sessions[Math.floor(Math.random() * sessions.length)];
        return session;
    }

    // Verificar status de todas as sessões
    async checkAllSessions() {
        const statusReport = {};
        
        for (const [name, sessionId] of Object.entries(SESSIONS)) {
            const status = await getSessionStatus(sessionId);
            statusReport[name] = status;
            
            if (status && status.status === 'CONNECTED') {
                this.activeSessions.add(name);
            } else {
                this.activeSessions.delete(name);
            }
        }
        
        return statusReport;
    }
}

module.exports = SessionManager;