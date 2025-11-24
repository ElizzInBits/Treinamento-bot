#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Iniciando reconexão forçada...\n');

// 1. Matar processos Chrome
console.log('1️⃣ Finalizando processos Chrome...');
try {
  execSync('pkill -9 -f chrome', { stdio: 'ignore' });
  execSync('pkill -9 -f chromium', { stdio: 'ignore' });
  console.log('✅ Processos finalizados\n');
} catch (e) {
  console.log('✅ Nenhum processo para finalizar\n');
}

// 2. Remover tokens
console.log('2️⃣ Removendo tokens antigos...');
const tokensPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
if (fs.existsSync(tokensPath)) {
  fs.rmSync(tokensPath, { recursive: true, force: true });
  console.log('✅ Tokens removidos\n');
} else {
  console.log('✅ Nenhum token para remover\n');
}

// 3. Reiniciar serviço
console.log('3️⃣ Reiniciando bot...');
try {
  execSync('pm2 restart whatsapp-bot', { stdio: 'inherit' });
  console.log('\n✅ Bot reiniciado!\n');
} catch (e) {
  console.log('❌ Erro ao reiniciar:', e.message);
}

console.log('📱 Aguarde o QR Code aparecer nos logs...');
console.log('💡 Execute: pm2 logs whatsapp-bot\n');
