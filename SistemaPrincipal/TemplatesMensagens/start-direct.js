// Arquivo de inicialização do bot WhatsApp
console.log('🤖 Iniciando WhatsApp Bot...');

// Carregar o processador principal de mensagens
require('./Template2.js');

console.log('✅ Bot WhatsApp iniciado com sucesso!');
console.log('📱 Aguardando mensagens...');
console.log('🚀 WhatsApp Bot está rodando...');

// Manter o processo ativo
process.on('SIGINT', () => {
    console.log('🛑 Parando WhatsApp Bot...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Recebido SIGTERM, parando WhatsApp Bot...');
    process.exit(0);
});

// Evitar que o processo termine
process.stdin.resume();