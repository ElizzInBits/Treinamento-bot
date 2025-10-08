// Arquivo de inicialização do bot WhatsApp
console.log('🤖 Iniciando WhatsApp Bot...');

const mantenedorSessao = require('./manterSessao');
const controleInstancia = require('./controleInstancia');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Função principal async
async function iniciarBot() {
  try {
    // Verificar se já existe uma instância rodando
    if (controleInstancia.verificarInstanciaExistente()) {
      console.log('⚠️ Já existe uma instância do bot rodando!');
      console.log('🔄 Aguardando liberação ou forçando limpeza...');
      await controleInstancia.aguardarLiberacao();
    }
    
    // Criar lock para esta instância
    controleInstancia.criarLock();
    // Verificar estado da sessão
    console.log('🔍 Verificando estado da sessão...');
    const sessaoExistente = mantenedorSessao.verificarSessaoExistente();
    const temTokens = mantenedorSessao.verificarTokensWhatsApp();

    if (sessaoExistente && temTokens) {
      console.log('✅ Sessão existente encontrada - Restaurando conexão...');
    } else if (!temTokens) {
      console.log('🆕 Primeira execução ou tokens perdidos - QR Code será necessário');
    } else {
      console.log('🔄 Tentando restaurar sessão...');
    }

    // Função para limpeza robusta de locks e processos
    async function limpezaRobusta() {
      try {
        console.log('🧹 Executando limpeza robusta...');
        
        // Matar processos Chrome órfãos
        try {
          execSync('pkill -9 -f "chrome.*WHATSAPP_BOT_DIRECT"', { stdio: 'ignore' });
          execSync('pkill -9 -f chromium', { stdio: 'ignore' });
          execSync('pkill -9 -f wppconnect', { stdio: 'ignore' });
          console.log('✅ Processos Chrome finalizados');
        } catch (e) {}
        
        // Aguardar processos terminarem
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Remover arquivos de lock
        const tokensDir = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
        if (fs.existsSync(tokensDir)) {
          const arquivos = fs.readdirSync(tokensDir);
          arquivos.forEach(arquivo => {
            if (arquivo.includes('lock') || arquivo.includes('Lock')) {
              try {
                fs.unlinkSync(path.join(tokensDir, arquivo));
                console.log(`✅ Removido: ${arquivo}`);
              } catch (e) {}
            }
          });
        }
        
        // Limpar cache temporário
        try {
          execSync('rm -rf /tmp/.org.chromium.* /tmp/chrome_*', { stdio: 'ignore' });
        } catch (e) {}
        
        console.log('✅ Limpeza robusta concluída');
      } catch (error) {
        console.log('⚠️ Erro na limpeza robusta:', error.message);
      }
    }

    // Executar limpeza robusta
    await limpezaRobusta();

    // Aguardar um pouco antes de carregar o sistema principal
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🚀 Carregando sistema principal...');
    require('./Template2.js');
    
    console.log('✅ Bot iniciado com sucesso!');
    console.log(`🆔 PID: ${process.pid}`);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar bot:', error);
    controleInstancia.limparLock();
    process.exit(1);
  }
}

// Iniciar o bot
iniciarBot();

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