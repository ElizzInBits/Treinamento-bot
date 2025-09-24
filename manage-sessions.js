const SessionManager = require('./SistemaPrincipal/TemplatesMensagens/session-manager');
const { SESSIONS } = require('./SistemaPrincipal/TemplatesMensagens/multi-session-api');

const sessionManager = new SessionManager();

async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'init':
            console.log('🚀 Inicializando todas as sessões...');
            await sessionManager.initAllSessions();
            break;
            
        case 'status':
            console.log('📊 Verificando status das sessões...');
            const status = await sessionManager.checkAllSessions();
            console.table(status);
            break;
            
        case 'create':
            const sessionName = process.argv[3];
            if (!sessionName) {
                console.log('❌ Especifique o nome da sessão: node manage-sessions.js create PRINCIPAL');
                return;
            }
            console.log(`🔄 Criando sessão ${sessionName}...`);
            await sessionManager.initSession(sessionName, SESSIONS[sessionName]);
            break;
            
        default:
            console.log(`
📱 Gerenciador de Sessões WhatsApp

Comandos disponíveis:
  node manage-sessions.js init     - Inicializar todas as sessões
  node manage-sessions.js status   - Verificar status das sessões
  node manage-sessions.js create PRINCIPAL - Criar sessão específica

Sessões disponíveis: ${Object.keys(SESSIONS).join(', ')}
            `);
    }
    
    process.exit(0);
}

main().catch(console.error);