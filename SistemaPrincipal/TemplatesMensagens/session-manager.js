const { 
    createSession, 
    getSessionStatus, 
    checkAllSessions,
    getSessionQR,
    closeSession,
    getAvailableSession,
    SESSIONS,
    sessionStatus 
} = require('./multi-session-api');

class SessionManager {
    constructor() {
        this.activeSessions = new Set();
        this.sessionQueue = [];
        this.autoCheckInterval = null;
        this.startAutoCheck();
    }

    // Iniciar verificação automática das sessões
    startAutoCheck() {
        if (this.autoCheckInterval) return;
        
        this.autoCheckInterval = setInterval(async () => {
            await this.checkAllSessions();
        }, 30000); // Verifica a cada 30 segundos
        
        console.log('🔄 Verificação automática de sessões iniciada');
    }

    // Parar verificação automática
    stopAutoCheck() {
        if (this.autoCheckInterval) {
            clearInterval(this.autoCheckInterval);
            this.autoCheckInterval = null;
            console.log('⏹️ Verificação automática de sessões parada');
        }
    }

    // Inicializar todas as sessões
    async initAllSessions() {
        console.log('🔄 Inicializando todas as sessões...');
        
        for (const sessionName of Object.keys(SESSIONS)) {
            try {
                await this.initSession(sessionName);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Aguarda 3s entre sessões
            } catch (error) {
                console.error(`❌ Erro ao inicializar ${sessionName}:`, error.message);
            }
        }
        
        // Verificar status após inicialização
        setTimeout(() => this.checkAllSessions(), 5000);
    }

    // Inicializar sessão específica
    async initSession(sessionName) {
        console.log(`🔄 Inicializando sessão ${sessionName}...`);
        
        const status = await getSessionStatus(sessionName);
        
        if (!status || status.status !== 'CONNECTED') {
            const result = await createSession(sessionName);
            if (result) {
                console.log(`✅ Sessão ${sessionName} iniciada. Escaneie o QR Code.`);
                return true;
            }
        } else {
            console.log(`✅ Sessão ${sessionName} já conectada`);
            this.activeSessions.add(sessionName);
            return true;
        }
        
        return false;
    }

    // Obter QR Code de uma sessão
    async getQRCode(sessionName) {
        return await getSessionQR(sessionName);
    }

    // Fechar sessão específica
    async closeSession(sessionName) {
        const result = await closeSession(sessionName);
        if (result) {
            this.activeSessions.delete(sessionName);
        }
        return result;
    }

    // Obter sessão disponível
    getAvailableSession() {
        return getAvailableSession();
    }

    // Verificar status de todas as sessões
    async checkAllSessions() {
        const statusReport = await checkAllSessions();
        
        // Atualizar sessões ativas
        this.activeSessions.clear();
        for (const [sessionName, info] of Object.entries(statusReport)) {
            if (info.connected) {
                this.activeSessions.add(sessionName);
            }
        }
        
        return statusReport;
    }

    // Obter estatísticas das sessões
    getSessionStats() {
        const connected = Array.from(this.activeSessions);
        const total = Object.keys(SESSIONS).length;
        
        return {
            total,
            connected: connected.length,
            disconnected: total - connected.length,
            activeSessions: connected,
            sessionStatus
        };
    }

    // Reiniciar sessão específica
    async restartSession(sessionName) {
        console.log(`🔄 Reiniciando sessão ${sessionName}...`);
        
        // Fechar sessão atual
        await this.closeSession(sessionName);
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inicializar novamente
        return await this.initSession(sessionName);
    }

    // Destruir o gerenciador
    destroy() {
        this.stopAutoCheck();
        this.activeSessions.clear();
    }
}

module.exports = SessionManager;