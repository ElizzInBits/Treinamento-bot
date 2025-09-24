// Arquivo de inicialização do bot WhatsApp
console.log('🤖 Iniciando WhatsApp Bot...');

// Importar dependências necessárias
const { sendMessage } = require('./sendMessage-api');

// Função principal do bot
async function startBot() {
    console.log('✅ Bot WhatsApp iniciado com sucesso!');
    console.log('📱 Aguardando mensagens...');
    
    // Aqui você pode adicionar lógica do bot se necessário
    // Por exemplo, listeners de mensagens, etc.
}

// Iniciar o bot
startBot().catch(console.error);

// Manter o processo ativo
process.on('SIGINT', () => {
    console.log('🛑 Parando WhatsApp Bot...');
    process.exit(0);
});

console.log('🚀 WhatsApp Bot está rodando...');