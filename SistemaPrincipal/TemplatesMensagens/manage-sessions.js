const SessionManager = require('./session-manager');
const { 
    checkAllSessions, 
    getSessionQR, 
    SESSIONS 
} = require('./multi-session-api');

class MultiSessionController {
    constructor() {
        this.sessionManager = new SessionManager();
    }

    // Inicializar todas as sessões
    async initAll() {
        console.log('🚀 Iniciando todas as sessões...');
        await this.sessionManager.initAllSessions();
        
        setTimeout(async () => {
            const stats = await this.getStats();
            console.log('📊 Status das sessões:', stats);
        }, 10000);
    }

    // Inicializar sessão específica
    async initSession(sessionName) {
        if (!SESSIONS[sessionName]) {
            console.error(`❌ Sessão ${sessionName} não existe`);
            return false;
        }
        
        return await this.sessionManager.initSession(sessionName);
    }

    // Obter QR Code de uma sessão
    async getQR(sessionName) {
        if (!SESSIONS[sessionName]) {
            console.error(`❌ Sessão ${sessionName} não existe`);
            return false;
        }
        
        const qr = await this.sessionManager.getQRCode(sessionName);
        if (qr && qr.qrcode) {
            console.log(`📱 QR Code da sessão ${sessionName}:`);
            console.log(qr.qrcode);
        }
        return qr;
    }

    // Verificar status de todas as sessões
    async checkStatus() {
        return await this.sessionManager.checkAllSessions();
    }

    // Obter estatísticas
    async getStats() {
        return this.sessionManager.getSessionStats();
    }

    // Fechar sessão específica
    async closeSession(sessionName) {
        return await this.sessionManager.closeSession(sessionName);
    }

    // Reiniciar sessão específica
    async restartSession(sessionName) {
        return await this.sessionManager.restartSession(sessionName);
    }

    // Listar todas as sessões disponíveis
    listSessions() {
        console.log('📋 Sessões disponíveis:');
        Object.entries(SESSIONS).forEach(([name, id]) => {
            console.log(`  ${name}: ${id}`);
        });
    }

    // Monitorar sessões em tempo real
    async monitor() {
        console.log('👀 Monitorando sessões...');
        
        setInterval(async () => {
            const stats = await this.getStats();
            const timestamp = new Date().toLocaleTimeString();
            
            console.log(`\n[${timestamp}] 📊 Status das Sessões:`);
            console.log(`  ✅ Conectadas: ${stats.connected}/${stats.total}`);
            console.log(`  🔴 Desconectadas: ${stats.disconnected}`);
            
            if (stats.activeSessions.length > 0) {
                console.log(`  📱 Ativas: ${stats.activeSessions.join(', ')}`);
            }
        }, 60000); // A cada minuto
    }

    // Destruir controlador
    destroy() {
        this.sessionManager.destroy();
    }
}

// Função para uso via linha de comando
async function main() {
    const controller = new MultiSessionController();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🤖 Gerenciador de Múltiplas Sessões WhatsApp

Comandos disponíveis:
  node manage-sessions.js init-all          - Inicializar todas as sessões
  node manage-sessions.js init <sessao>     - Inicializar sessão específica
  node manage-sessions.js qr <sessao>       - Obter QR Code de uma sessão
  node manage-sessions.js status            - Verificar status de todas as sessões
  node manage-sessions.js stats             - Obter estatísticas das sessões
  node manage-sessions.js close <sessao>    - Fechar sessão específica
  node manage-sessions.js restart <sessao>  - Reiniciar sessão específica
  node manage-sessions.js list              - Listar sessões disponíveis
  node manage-sessions.js monitor           - Monitorar sessões em tempo real

Sessões disponíveis: ${Object.keys(SESSIONS).join(', ')}
        `);
        return;
    }

    const command = args[0];
    const sessionName = args[1];

    try {
        switch (command) {
            case 'init-all':
                await controller.initAll();
                break;
                
            case 'init':
                if (!sessionName) {
                    console.error('❌ Especifique o nome da sessão');
                    return;
                }
                await controller.initSession(sessionName);
                break;
                
            case 'qr':
                if (!sessionName) {
                    console.error('❌ Especifique o nome da sessão');
                    return;
                }
                await controller.getQR(sessionName);
                break;
                
            case 'status':
                const status = await controller.checkStatus();
                console.log('📊 Status das sessões:', JSON.stringify(status, null, 2));
                break;
                
            case 'stats':
                const stats = await controller.getStats();
                console.log('📊 Estatísticas:', JSON.stringify(stats, null, 2));
                break;
                
            case 'close':
                if (!sessionName) {
                    console.error('❌ Especifique o nome da sessão');
                    return;
                }
                await controller.closeSession(sessionName);
                break;
                
            case 'restart':
                if (!sessionName) {
                    console.error('❌ Especifique o nome da sessão');
                    return;
                }
                await controller.restartSession(sessionName);
                break;
                
            case 'list':
                controller.listSessions();
                break;
                
            case 'monitor':
                await controller.monitor();
                break;
                
            default:
                console.error(`❌ Comando desconhecido: ${command}`);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = MultiSessionController;