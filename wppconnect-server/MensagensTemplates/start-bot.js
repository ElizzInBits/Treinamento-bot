const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando sistema de bot WhatsApp...');

function startBot() {
  const botProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  botProcess.on('close', (code) => {
    console.log(`\n⚠️ Bot encerrado com código: ${code}`);
    
    if (code !== 0) {
      console.log('🔄 Reiniciando bot em 5 segundos...');
      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });

  botProcess.on('error', (err) => {
    console.error('❌ Erro ao iniciar bot:', err);
    console.log('🔄 Tentando novamente em 10 segundos...');
    setTimeout(() => {
      startBot();
    }, 10000);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Encerrando bot...');
    botProcess.kill('SIGINT');
    process.exit(0);
  });
}

startBot();