require('dotenv').config();
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { processarMensagem } = require('./Template2');

// Variável global para o cliente
let globalClient = null;

console.log('🚀 Iniciando Template Processor...');

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco conectado - Template');
  } catch (error) {
    console.error('❌ Erro no banco - Template:', error);
  }
})();

// Verificar se já existe sessão ativa
const fs = require('fs');
const path = require('path');

function verificarSessaoExistente() {
  const tokensPath = path.join(__dirname, 'tokens', 'NERDWHATS_AMERICA');
  return fs.existsSync(tokensPath);
}

// Função para inicializar conexão
async function inicializarBot() {
  const sessaoExiste = verificarSessaoExistente();
  
  if (sessaoExiste) {
    console.log('🔄 Sessão NERDWHATS_AMERICA encontrada, reutilizando...');
  } else {
    console.log('🆕 Criando nova sessão NERDWHATS_AMERICA...');
  }
  
  return wppconnect.create({
  session: 'NERDWHATS_AMERICA',
  headless: true,
  disableWelcome: true,
  updatesLog: false,
  autoClose: 0, // Não fechar automaticamente
  createPathFileToken: true, // Criar arquivo de token
  waitForLogin: true, // Aguardar login
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },
  catchQR: (base64Qr, asciiQR) => {
    console.log('\n📱 QR CODE:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Status:', status);
    if (status === 'isLogged') {
      console.log('✅ Sessão existente encontrada!');
    }
    if (status === 'qrReadSuccess') {
      console.log('✅ QR Code escaneado com sucesso!');
    }
    if (status === 'chatsAvailable') {
      console.log('✅ Chats disponíveis - conectado!');
    }
  }
  }).then(client => {
    console.log('✅ Bot conectado!');
    globalClient = client;
    
    // Monitor de estado da conexão
    client.onStateChange((state) => {
      console.log('🔄 Estado mudou para:', state);
      
      if (state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNLAUNCHED') {
        console.log('⚠️ Sessão desconectada! Motivo:', state);
        globalClient = null;
      }
      
      if (state === 'CONNECTED') {
        console.log('✅ Reconectado com sucesso!');
      }
    });
    
    // Monitor de mudanças na interface
    client.onInterfaceChange((interfaceInfo) => {
      if (interfaceInfo.mode === 'QR') {
        console.log('📱 QR Code necessário - sessão expirou');
        globalClient = null;
      }
    });
    
    client.onMessage(async (message) => {
      try {
        await processarMensagem(message, client);
      } catch (error) {
        console.error('❌ Erro no processamento:', error);
      }
    });
  }).catch(err => {
    console.error('❌ Erro ao conectar:', err);
  });
}

// Inicializar o bot
inicializarBot();

// Função para verificar se há sessão ativa
function verificarSessaoAtiva() {
  return globalClient && globalClient.isConnected;
}

// Função para verificar status da conexão
async function verificarStatusConexao() {
  if (!globalClient) return 'DESCONECTADO';
  
  try {
    const isConnected = await globalClient.isConnected();
    return isConnected ? 'CONECTADO' : 'DESCONECTADO';
  } catch (error) {
    return 'ERRO';
  }
}

// Sistema de reconexão automática
let tentativasReconexao = 0;
const MAX_TENTATIVAS = 3;

function tentarReconexao() {
  if (tentativasReconexao >= MAX_TENTATIVAS) {
    console.log('❌ Máximo de tentativas de reconexão atingido');
    return;
  }
  
  tentativasReconexao++;
  console.log(`🔄 Tentativa de reconexão ${tentativasReconexao}/${MAX_TENTATIVAS}...`);
  
  setTimeout(() => {
    // Reiniciar o processo de conexão
    process.exit(1); // PM2 vai reiniciar automaticamente
  }, 5000);
}

// Verificar conexão periodicamente
setInterval(async () => {
  if (globalClient) {
    try {
      const isConnected = await globalClient.isConnected();
      if (!isConnected) {
        console.log('⚠️ Conexão perdida detectada!');
        globalClient = null;
        tentarReconexao();
      } else {
        tentativasReconexao = 0; // Reset contador se conectado
      }
    } catch (error) {
      console.log('❌ Erro ao verificar conexão:', error.message);
    }
  }
}, 30000); // Verificar a cada 30 segundos

// Exportar cliente para uso no template
module.exports = { 
  getClient: () => globalClient,
  verificarSessaoAtiva,
  verificarStatusConexao
};