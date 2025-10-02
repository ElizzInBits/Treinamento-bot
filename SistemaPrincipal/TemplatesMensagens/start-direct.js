// Arquivo de inicialização do bot WhatsApp
console.log('🤖 Iniciando WhatsApp Bot...');

// Verificar e limpar arquivos de lock antes de iniciar
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function verificarELimparLocks() {
  try {
    console.log('🔍 Verificando arquivos de lock...');
    
    // Verificar se existe SingletonLock
    const lockPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT', 'SingletonLock');
    if (fs.existsSync(lockPath)) {
      console.log('⚠️ SingletonLock detectado, removendo...');
      
      // Matar processos Chrome
      try {
        execSync('pkill -9 -f chrome', { stdio: 'ignore' });
        execSync('pkill -9 -f chromium', { stdio: 'ignore' });
      } catch (e) {}
      
      // Remover diretório completo
      const tokensDir = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
      if (fs.existsSync(tokensDir)) {
        fs.rmSync(tokensDir, { recursive: true, force: true });
        console.log('✅ Diretório de tokens limpo');
      }
    }
  } catch (error) {
    console.log('⚠️ Erro na verificação:', error.message);
  }
}

// Executar verificação
verificarELimparLocks();

// Aguardar um pouco antes de carregar o sistema principal
setTimeout(() => {
  // Carregar o processador principal de mensagens
  require('./Template2.js');
}, 2000);

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