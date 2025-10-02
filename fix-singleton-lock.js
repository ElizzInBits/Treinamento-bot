#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Iniciando correção do problema SingletonLock...');

async function corrigirSingletonLock() {
  try {
    // 1. Parar PM2
    console.log('⏹️ Parando PM2...');
    try {
      execSync('pm2 stop all', { stdio: 'inherit' });
      execSync('pm2 delete all', { stdio: 'inherit' });
    } catch (e) {
      console.log('⚠️ PM2 já estava parado');
    }

    // 2. Matar processos Chrome
    console.log('🔫 Finalizando processos Chrome...');
    try {
      execSync('pkill -9 -f chrome', { stdio: 'ignore' });
      execSync('pkill -9 -f chromium', { stdio: 'ignore' });
      console.log('✅ Processos Chrome finalizados');
    } catch (e) {
      console.log('⚠️ Nenhum processo Chrome encontrado');
    }

    // 3. Aguardar processos finalizarem
    console.log('⏳ Aguardando processos finalizarem...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Remover diretórios de tokens
    console.log('🗑️ Removendo diretórios de tokens...');
    const tokensPath1 = path.join(__dirname, 'SistemaPrincipal', 'TemplatesMensagens', 'tokens', 'WHATSAPP_BOT_DIRECT');
    const tokensPath2 = path.join(__dirname, 'wppconnect-server', 'userDataDir', 'WHATSAPP_BOT_DIRECT');
    
    [tokensPath1, tokensPath2].forEach(tokenPath => {
      if (fs.existsSync(tokenPath)) {
        fs.rmSync(tokenPath, { recursive: true, force: true });
        console.log(`✅ Removido: ${tokenPath}`);
      }
    });

    // 5. Limpar cache do snap chromium
    console.log('🧹 Limpando cache do snap chromium...');
    const os = require('os');
    const snapPath = path.join(os.homedir(), 'snap', 'chromium', 'common', 'chromium');
    
    if (fs.existsSync(snapPath)) {
      try {
        const files = fs.readdirSync(snapPath);
        files.forEach(file => {
          if (file.includes('SingletonLock')) {
            const filePath = path.join(snapPath, file);
            fs.unlinkSync(filePath);
            console.log(`✅ Removido: ${filePath}`);
          }
        });
        
        // Remover subdiretórios com SingletonLock
        files.forEach(file => {
          const fullPath = path.join(snapPath, file);
          if (fs.statSync(fullPath).isDirectory()) {
            const lockFile = path.join(fullPath, 'SingletonLock');
            if (fs.existsSync(lockFile)) {
              fs.unlinkSync(lockFile);
              console.log(`✅ Removido: ${lockFile}`);
            }
          }
        });
      } catch (e) {
        console.log('⚠️ Erro ao limpar snap cache:', e.message);
      }
    }

    // 6. Aguardar limpeza
    console.log('⏳ Aguardando limpeza finalizar...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Reiniciar sistema
    console.log('🚀 Reiniciando sistema...');
    execSync('pm2 start ecosystem.config.js', { stdio: 'inherit' });

    console.log('✅ Correção do SingletonLock concluída com sucesso!');
    console.log('🎉 Sistema reiniciado e funcionando!');

  } catch (error) {
    console.error('❌ Erro durante correção:', error.message);
    process.exit(1);
  }
}

// Executar correção
corrigirSingletonLock();