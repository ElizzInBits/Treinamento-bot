#!/usr/bin/env node

console.log('🚀 Iniciando Sistema de Múltiplas Sessões WhatsApp...\n');

const { startMultiSession } = require('./SistemaPrincipal/TemplatesMensagens/multi-session-start');
const MultiSessionController = require('./SistemaPrincipal/TemplatesMensagens/manage-sessions');

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'help' || command === '--help' || command === '-h') {
        console.log(`
🤖 Sistema de Múltiplas Sessões WhatsApp

Comandos disponíveis:
  node start-multi-sessions.js                    - Iniciar sistema completo
  node start-multi-sessions.js init              - Apenas inicializar sessões
  node start-multi-sessions.js status            - Verificar status das sessões
  node start-multi-sessions.js qr <sessao>       - Obter QR Code de uma sessão
  node start-multi-sessions.js restart <sessao>  - Reiniciar sessão específica
  node start-multi-sessions.js monitor           - Monitorar sessões em tempo real

Sessões disponíveis: PRINCIPAL, SECUNDARIO, TERCEIRO, QUARTO, QUINTO
        `);
        return;
    }

    try {
        const controller = new MultiSessionController();

        switch (command) {
            case 'init':
                console.log('🔄 Inicializando apenas as sessões...');
                await controller.initAll();
                break;

            case 'status':
                console.log('📊 Verificando status das sessões...');
                const status = await controller.checkStatus();
                console.log('\n📋 Status das Sessões:');
                Object.entries(status).forEach(([name, info]) => {
                    const statusIcon = info.connected ? '✅' : '🔴';
                    console.log(`  ${statusIcon} ${name}: ${info.connected ? 'CONECTADA' : 'DESCONECTADA'}`);
                });
                
                const stats = await controller.getStats();
                console.log(`\n📊 Resumo: ${stats.connected}/${stats.total} sessões conectadas`);
                break;

            case 'qr':
                const sessionName = args[1];
                if (!sessionName) {
                    console.error('❌ Especifique o nome da sessão (PRINCIPAL, SECUNDARIO, etc.)');
                    return;
                }
                console.log(`📱 Obtendo QR Code da sessão ${sessionName}...`);
                await controller.getQR(sessionName);
                break;

            case 'restart':
                const restartSession = args[1];
                if (!restartSession) {
                    console.error('❌ Especifique o nome da sessão para reiniciar');
                    return;
                }
                console.log(`🔄 Reiniciando sessão ${restartSession}...`);
                await controller.restartSession(restartSession);
                break;

            case 'monitor':
                console.log('👀 Iniciando monitoramento das sessões...');
                await controller.monitor();
                break;

            default:
                // Inicialização completa do sistema
                console.log('🚀 Iniciando sistema completo de múltiplas sessões...');
                
                // Inicializar sistema de múltiplas sessões
                await startMultiSession();
                
                console.log('\n✅ Sistema de múltiplas sessões iniciado!');
                console.log('\n📋 Próximos passos:');
                console.log('1. Escaneie os QR Codes das sessões desconectadas');
                console.log('2. Use "node start-multi-sessions.js status" para verificar conexões');
                console.log('3. Use "node start-multi-sessions.js qr <SESSAO>" para ver QR Code específico');
                
                // Manter o processo rodando
                console.log('\n🔄 Sistema rodando... Pressione Ctrl+C para parar');
                
                // Monitoramento contínuo
                setInterval(async () => {
                    try {
                        const stats = await controller.getStats();
                        const timestamp = new Date().toLocaleTimeString();
                        console.log(`[${timestamp}] 📊 Sessões ativas: ${stats.connected}/${stats.total}`);
                    } catch (error) {
                        console.error('❌ Erro no monitoramento:', error.message);
                    }
                }, 300000); // A cada 5 minutos
                
                break;
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

// Tratar interrupção do processo
process.on('SIGINT', () => {
    console.log('\n🛑 Parando sistema de múltiplas sessões...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Sistema de múltiplas sessões finalizado');
    process.exit(0);
});

// Executar
main().catch(error => {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
});