// Arquivo de inicialização do bot WhatsApp
console.log('🤖 Iniciando WhatsApp Bot...');

// Importar dependências necessárias
const { sendMessage } = require('./sendMessage-api');

// Função principal do bot
async function startBot() {
    console.log('✅ Bot WhatsApp iniciado com sucesso!');
    console.log('📱 Aguardando mensagens...');
    
    // Manter o processo ativo com um loop infinito
    setInterval(() => {
        // Heartbeat para manter o processo vivo
        // console.log('💓 Bot ativo:', new Date().toISOString());
    }, 30000); // A cada 30 segundos
}

// Iniciar o bot
startBot().catch(console.error);

// Manter o processo ativo
process.on('SIGINT', () => {
    console.log('🛑 Parando WhatsApp Bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, parando WhatsApp Bot...');
    process.exit(0);
});

console.log('🚀 WhatsApp Bot está rodando...');

// Evitar que o processo termine
process.stdin.resume();