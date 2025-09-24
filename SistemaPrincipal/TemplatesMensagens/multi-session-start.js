const MultiSessionController = require('./manage-sessions');
const { sendMessage } = require('./sendMessage-api');

class MultiSessionBot {
    constructor() {
        this.controller = new MultiSessionController();
        this.isInitialized = false;
    }

    // Inicializar o sistema de múltiplas sessões
    async initialize() {
        if (this.isInitialized) {
            console.log('⚠️ Sistema já inicializado');
            return;
        }

        console.log('🚀 Inicializando sistema de múltiplas sessões...');
        
        try {
            // Inicializar todas as sessões
            await this.controller.initAll();
            
            // Aguardar um tempo para as sessões se conectarem
            console.log('⏳ Aguardando conexões das sessões...');
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            // Verificar status final
            const stats = await this.controller.getStats();
            console.log('📊 Sistema inicializado:', stats);
            
            if (stats.connected > 0) {
                console.log('✅ Sistema de múltiplas sessões ativo!');
                this.isInitialized = true;
                
                // Iniciar monitoramento
                this.startMonitoring();
            } else {
                console.log('⚠️ Nenhuma sessão conectada. Verifique os QR Codes.');
            }
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema:', error.message);
        }
    }

    // Iniciar monitoramento das sessões
    startMonitoring() {
        setInterval(async () => {
            try {
                const stats = await this.controller.getStats();
                
                if (stats.connected === 0) {
                    console.log('⚠️ Todas as sessões desconectadas! Tentando reconectar...');
                    await this.controller.initAll();
                }
            } catch (error) {
                console.error('❌ Erro no monitoramento:', error.message);
            }
        }, 120000); // Verifica a cada 2 minutos
    }

    // Enviar mensagem usando qualquer sessão disponível
    async sendMessage(phone, endpoint, body = {}) {
        if (!this.isInitialized) {
            console.log('⚠️ Sistema não inicializado, usando sessão padrão');
        }
        
        return await sendMessage(phone, endpoint, body);
    }

    // Enviar mensagem usando sessão específica
    async sendMessageWithSession(phone, endpoint, body = {}, sessionName) {
        return await sendMessage(phone, endpoint, body, sessionName);
    }

    // Obter estatísticas das sessões
    async getStats() {
        return await this.controller.getStats();
    }

    // Obter QR Code de uma sessão
    async getQR(sessionName) {
        return await this.controller.getQR(sessionName);
    }

    // Reiniciar sessão específica
    async restartSession(sessionName) {
        return await this.controller.restartSession(sessionName);
    }

    // Parar o sistema
    stop() {
        this.controller.destroy();
        this.isInitialized = false;
        console.log('🛑 Sistema de múltiplas sessões parado');
    }
}

// Instância global
const multiSessionBot = new MultiSessionBot();

// Função para inicializar automaticamente
async function startMultiSession() {
    await multiSessionBot.initialize();
}

// Exportar para uso em outros módulos
module.exports = {
    MultiSessionBot,
    multiSessionBot,
    startMultiSession
};

// Auto-inicializar se executado diretamente
if (require.main === module) {
    startMultiSession().catch(console.error);
}