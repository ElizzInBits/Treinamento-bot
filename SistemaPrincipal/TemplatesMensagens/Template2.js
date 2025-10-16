const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const UsuarioModel = require('../BancoDeDados/models/usuario');
const treinamentoSSMA = require('./Treinamentos/LCM/treinamentoSSMA');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
const sistemaIdentificacao = require('./sistemaIdentificacao');
const mantenedorSessao = require('./manterSessao');

// Inicializar sistema de limpeza de certificados
require('./Certificados/limpezaCertificados');

// Inicializar limpeza automática do banco
require('../BancoDeDados/scripts/limpezaAutomatica');



// Inicializar modelo
let Usuario = null;



// Cliente WhatsApp direto
let wppClient = null;

// Controle de mensagens duplicadas
const mensagensProcessando = new Map();
const TIMEOUT_DUPLICADA = 5000; // 5 segundos

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    Usuario = UsuarioModel(sequelize);
    console.log('✅ Banco conectado - Template2');
  } catch (error) {
    console.error('❌ Erro no banco - Template2:', error);
  }
})();

// Função para processar mensagens
async function processarMensagem(message, client) {
  const telefone = message.from.replace('@c.us', '');
  const mensagem = message.body.trim();
  
  console.log(`💬 [Template2] Processando: "${mensagem}" de ${telefone}`);
  
  // Verificar comandos especiais
  if (mensagem.toLowerCase().includes('restart') || mensagem.toLowerCase().includes('reiniciar')) {
    console.log(`🔄 COMANDO RESTART de ${telefone}`);
    mensagensProcessando.clear();
    console.log('🧹 Cache de mensagens duplicadas limpo');
    await client.sendText(message.from, '🔄 *Sistema reiniciado!*\n\nCache limpo. Você pode continuar.');
    setTimeout(() => inicializarBot(), 2000);
    return;
  }
  
  if (mensagem.toLowerCase().includes('limpar sessao') || mensagem.toLowerCase().includes('reset sessao')) {
    console.log(`🧹 COMANDO LIMPAR SESSÃO de ${telefone}`);
    mantenedorSessao.limparSessao();
    await client.sendText(message.from, '🧹 *Sessão limpa!*\n\nVocê precisará escanear o QR Code novamente.');
    setTimeout(() => {
      process.exit(0); // Forçar restart completo
    }, 1000);
    return;
  }
  
  if (mensagem.toLowerCase().includes('status sessao')) {
    console.log(`📊 COMANDO STATUS SESSÃO de ${telefone}`);
    const sessao = mantenedorSessao.verificarSessaoExistente();
    const tokens = mantenedorSessao.verificarTokensWhatsApp();
    await client.sendText(message.from, `📊 *Status da Sessão:*\n\nSessão ativa: ${sessao ? '✅ Sim' : '❌ Não'}\nTokens: ${tokens ? '✅ Presentes' : '❌ Ausentes'}\nÚltima atividade: ${sessao ? new Date(sessao.ultimoHeartbeat).toLocaleString() : 'N/A'}`);
    return;
  }
  
  // Verificar se é mensagem duplicada
  if (verificarMensagemDuplicada(telefone, mensagem)) {
    return; // Ignorar mensagem duplicada
  }
  
  // Marcar mensagem como sendo processada
  marcarMensagemProcessando(telefone, mensagem);
  
  try {
    // Verificar se o modelo está carregado
    if (!Usuario) {
      console.log('⚠️ Modelo Usuario não carregado, enviando resposta genérica');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    // Função sendMessage para usar com treinamento
    const sendMessageForTraining = async (phone, endpoint, body) => {
      return await sendMessage(phone, endpoint, body);
    };
    
    // Função para buscar contato
    const buscarContato = async () => {
      const formatosTelefone = [
        telefone,                           // 553399595511
        telefone.substring(2),              // 3399595511  
        `${telefone.substring(0, 4)}9${telefone.substring(4)}`, // 5533999595511 (adicionar 9)
        telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone, // 5533999595511 -> 553399595511 (remover 9º dígito)
      ];
      
      for (const formato of formatosTelefone) {
        const contato = await Usuario.findOne({ where: { telefone: formato } });
        if (contato) {
          console.log(`✅ Contato encontrado: ${contato.nome} (formato: ${formato})`);
          return contato;
        }
      }
      
      console.log(`❌ Contato não encontrado: ${telefone}`);
      return null;
    };
    
    // Usar sistema de identificação para determinar o fluxo
    console.log('🚀 Processando através do sistema de identificação');
    await sistemaIdentificacao.processarMensagemInicial(telefone, mensagem, sendMessageForTraining, buscarContato);
    

  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await client.sendText(message.from, '❌ Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
  } finally {
    // Remover da lista de processamento após conclusão
    const chave = `${telefone}:${mensagem}`;
    setTimeout(() => {
      mensagensProcessando.delete(chave);
    }, 1000);
  }
}

// Controle de mensagens duplicadas
function verificarMensagemDuplicada(telefone, mensagem) {
  const chave = `${telefone}:${mensagem}`;
  const agora = Date.now();
  
  if (mensagensProcessando.has(chave)) {
    const timestamp = mensagensProcessando.get(chave);
    // Se a mensagem foi processada há menos de 5 segundos, é duplicada
    if (agora - timestamp < TIMEOUT_DUPLICADA) {
      console.log(`🔄 Mensagem duplicada ignorada: "${mensagem}" de ${telefone}`);
      return true;
    }
  }
  
  return false;
}

function marcarMensagemProcessando(telefone, mensagem) {
  const chave = `${telefone}:${mensagem}`;
  const agora = Date.now();
  
  mensagensProcessando.set(chave, agora);
  
  // Limpar mensagens antigas automaticamente
  setTimeout(() => {
    mensagensProcessando.delete(chave);
  }, TIMEOUT_DUPLICADA);
}

// Função para definir cliente
function setWppClient(client) {
    wppClient = client;
}

// Variáveis para controlar reconexões e instância única
let reconectando = false;
let instanciaAtiva = false;
let clienteAtivo = null;

// Função para limpar arquivos de lock e resolver problema do SingletonLock
function limparLockFiles() {
  try {
    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    
    console.log('🧹 Iniciando limpeza completa de arquivos de lock...');
    
    // Matar processos Chrome/Chromium restantes
    try {
      execSync('pkill -9 -f chrome', { stdio: 'ignore' });
      execSync('pkill -9 -f chromium', { stdio: 'ignore' });
      console.log('✅ Processos Chrome finalizados');
    } catch (e) {
      // Ignorar erro se não houver processos
    }
    
    // Remover diretório completo de tokens
    const tokensPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
    if (fs.existsSync(tokensPath)) {
      fs.rmSync(tokensPath, { recursive: true, force: true });
      console.log('🧹 Diretório de tokens removido completamente');
    }
    
    // Limpar cache do snap chromium se existir
    const os = require('os');
    const snapPath = path.join(os.homedir(), 'snap', 'chromium', 'common', 'chromium');
    if (fs.existsSync(snapPath)) {
      try {
        const files = fs.readdirSync(snapPath);
        files.forEach(file => {
          if (file.includes('SingletonLock')) {
            fs.unlinkSync(path.join(snapPath, file));
          }
        });
        console.log('🧹 Cache do snap chromium limpo');
      } catch (e) {
        // Ignorar erros de limpeza do snap
      }
    }
    
    // Aguardar um pouco para garantir limpeza
    setTimeout(() => {
      console.log('✅ Limpeza de lock concluída');
    }, 1000);
    
  } catch (error) {
    console.log('⚠️ Erro ao limpar lock:', error.message);
  }
}

// Função para limpar SingletonLock de forma agressiva
async function limparSingletonLock() {
  const fs = require('fs');
  const path = require('path');
  const { execSync } = require('child_process');
  
  try {
    console.log('🧹 Limpando SingletonLock...');
    
    // Matar TODOS os processos Chrome/Chromium
    try {
      execSync('pkill -9 -f "chrome.*WHATSAPP_BOT_DIRECT"', { stdio: 'ignore' });
      execSync('pkill -9 -f chromium', { stdio: 'ignore' });
      execSync('pkill -9 -f chrome', { stdio: 'ignore' });
      console.log('✅ Processos Chrome finalizados');
    } catch (e) {}
    
    // Aguardar processos terminarem
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Remover SingletonLock específico
    const lockPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT', 'SingletonLock');
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log('✅ SingletonLock removido');
    }
    
    // Remover outros arquivos de lock
    const tokensDir = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT');
    if (fs.existsSync(tokensDir)) {
      const files = fs.readdirSync(tokensDir);
      files.forEach(file => {
        if (file.includes('lock') || file.includes('Lock')) {
          try {
            fs.unlinkSync(path.join(tokensDir, file));
            console.log(`✅ Removido: ${file}`);
          } catch (e) {}
        }
      });
    }
    
  } catch (error) {
    console.log('⚠️ Erro ao limpar SingletonLock:', error.message);
  }
}

// Função para inicializar o bot com reconexão automática
async function inicializarBot() {
  if (reconectando || instanciaAtiva) {
    console.log('⏳ Instância já em andamento, aguardando...');
    return;
  }
  
  reconectando = true;
  instanciaAtiva = true;
  
  // Limpar SingletonLock antes de qualquer coisa
  await limparSingletonLock();
  
  // Verificar sessão existente
  const fs = require('fs');
  const path = require('path');
  
  const sessaoExistente = mantenedorSessao.verificarSessaoExistente();
  const temTokens = mantenedorSessao.verificarTokensWhatsApp();
  
  if (sessaoExistente && temTokens) {
    console.log('🔄 Tentando restaurar sessão existente...');
  } else if (!temTokens) {
    console.log('🆕 Primeira conexão ou tokens perdidos');
  }
  
  // Aguardar antes de inicializar
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const client = await wppconnect.create({
      session: 'WHATSAPP_BOT_DIRECT',
      headless: 'new',
      disableWelcome: true,
      updatesLog: false,
      autoClose: 0,
      qrTimeout: 0,
      tokenStore: 'file',
      folderNameToken: './tokens',
      mkdirFolderToken: './tokens',
      puppeteerOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=site-per-process',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-features=VizDisplayCompositor',
          '--disable-web-security',
          '--disable-features=site-per-process'
        ],
        protocolTimeout: 300000, // 5 minutos
        defaultViewport: { width: 800, height: 600 },
        userDataDir: path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT'),
        executablePath: undefined // Usar Chrome padrão do sistema
      },
      catchQR: (base64Qr, asciiQR) => {
        console.log('\n📱 QR CODE Bot Cliente:');
        console.log(asciiQR);
      },
      statusFind: (status) => {
        console.log('📶 Bot Cliente Status:', status);
        
        // Reconectar automaticamente em qualquer desconexão
        if (status === 'browserClose' || status === 'desconnectedMobile' || status === 'DISCONNECTED') {
          console.log(`🔄 Status ${status} - Reconectando imediatamente...`);
          setTimeout(() => {
            reconectando = false;
            instanciaAtiva = false;
            inicializarBot();
          }, 1000);
        }
        
        // Log de status importantes
        if (status === 'qrReadSuccess') {
          console.log('✅ QR Code lido com sucesso!');
          // Criar backup dos tokens após QR lido
          setTimeout(() => {
            mantenedorSessao.backupTokens();
          }, 5000);
        }
        if (status === 'chatsAvailable') {
          console.log('✅ Chats disponíveis - Sessão ativa!');
          // Atualizar status da sessão
          mantenedorSessao.salvarSessao({
            sessionId: 'WHATSAPP_BOT_DIRECT',
            status: 'ACTIVE',
            ultimaAtividade: Date.now()
          });
        }
        if (status === 'desconnectedMobile') {
          console.log('❌ Desconectado do celular!');
          mantenedorSessao.pararHeartbeat();
        }
      }
    });
    
    // Fechar cliente anterior se existir
    if (clienteAtivo) {
      try {
        await clienteAtivo.close();
      } catch (e) {}
    }
    
    wppClient = client;
    clienteAtivo = client;
    setWppClient(client);
    reconectando = false;
    console.log('✅ Bot Cliente conectado!');
    
    // Salvar dados da sessão
    mantenedorSessao.salvarSessao({
      sessionId: 'WHATSAPP_BOT_DIRECT',
      status: 'CONNECTED',
      conectadoEm: Date.now()
    });
    
    // Iniciar sistema de heartbeat
    mantenedorSessao.iniciarHeartbeat();
    
    // Sistema de monitoramento de conexão mais agressivo
    const monitorarConexao = setInterval(async () => {
      try {
        const state = await client.getConnectionState().catch(() => 'DISCONNECTED');
        if (state !== 'CONNECTED') {
          console.log(`⚠️ Estado da conexão: ${state}`);
          clearInterval(monitorarConexao);
          mantenedorSessao.pararHeartbeat();
          console.log('🔄 Conexão perdida - Reiniciando imediatamente...');
          reconectando = false;
          instanciaAtiva = false;
          setTimeout(() => {
            inicializarBot();
          }, 500);
        }
      } catch (error) {
        console.log('⚠️ Erro no monitor de conexão, reiniciando...', error.message);
        clearInterval(monitorarConexao);
        reconectando = false;
        instanciaAtiva = false;
        setTimeout(() => {
          inicializarBot();
        }, 1000);
      }
    }, 10000); // Verificar a cada 10 segundos
    
    // Listener de mensagens
    client.onMessage(async (message) => {
      if (!message.body) return;
      if (message.isGroupMsg) return;
      if (message.fromMe) return;
      
      console.log('📨 Mensagem recebida:', message.body, 'de:', message.from);
      
      try {
        await processarMensagem(message, client);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
      }
    });
    
    // Bloqueador de chamadas
    client.onIncomingCall(async (call) => {
      console.log('📞 Chamada recebida de:', call.peerJid);
      try {
        await client.rejectCall(call.id);
        await client.sendText(call.peerJid, '🚫 *Chamadas não são aceitas*\n\nEnvie mensagem de texto! 😊');
        console.log('✅ Chamada bloqueada');
      } catch (error) {
        console.error('❌ Erro ao bloquear:', error.message);
      }
    });
    
    // Listener para detectar mudanças de estado
    client.onStateChange((state) => {
      console.log('🔄 Estado mudou para:', state);
      if (state === 'CONNECTED') {
        console.log('✅ WhatsApp conectado com sucesso!');
      } else if (state === 'DISCONNECTED') {
        console.log('❌ WhatsApp desconectado!');
      }
    });
    
    // Listener para detectar quando a sessão é fechada
    client.onInterfaceChange((interfaceChange) => {
      console.log('🔄 Interface mudou:', interfaceChange);
    });
    
  } catch (error) {
    console.error('❌ Erro Bot Cliente:', error.message || 'Erro desconhecido');
    reconectando = false;
    instanciaAtiva = false;
    
    // Se for erro de SingletonLock, tentar limpar e reconectar
    if (error.message && (error.message.includes('SingletonLock') || error.message.includes('Failed to create'))) {
      console.log('🧹 Erro de SingletonLock detectado - Limpando e tentando novamente...');
      await limparSingletonLock();
      setTimeout(() => {
        inicializarBot();
      }, 5000);
      return;
    }
    
    // Não tentar reconectar se for erro de QR timeout
    if (error.message && (error.message.includes('QR') || error.message.includes('timeout'))) {
      console.log('⚠️ Erro de QR/Timeout - Aguardando nova tentativa manual');
      return;
    }
    
    console.log('🔄 Tentando reconectar em 20 segundos...');
    setTimeout(() => {
      inicializarBot();
    }, 20000);
  }
}

// Inicializar o bot
inicializarBot();

// Handlers para evitar crashes
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
    console.log('🔄 Tentando continuar execução...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason);
    console.log('🔄 Tentando continuar execução...');
});

// Verificação global desabilitada para evitar múltiplas instâncias

// Função sendMessage usando cliente direto
async function sendMessage(phone, endpoint, body = {}) {
    const sendStart = Date.now();
    
    if (!wppClient) {
        console.error('❌ Cliente WhatsApp não definido');
        return false;
    }
    
    try {
        // Verificar se o cliente ainda está conectado
        const state = await wppClient.getConnectionState().catch(() => 'DISCONNECTED');
        if (state !== 'CONNECTED') {
            console.log('⚠️ Cliente desconectado, tentando reconectar...');
            inicializarBot();
            return false;
        }
        
        let result;
        
        switch (endpoint) {
            case 'send-message':
                result = await wppClient.sendText(phone, body.message);
                break;
                
            case 'send-list-message':
                result = await wppClient.sendListMessage(phone, body);
                break;
                
            case 'send-file':
                // Verificar se arquivo existe antes de enviar
                const fs = require('fs');
                if (!fs.existsSync(body.path)) {
                    console.error(`❌ Arquivo não encontrado: ${body.path}`);
                    return false;
                }
                result = await wppClient.sendFile(phone, body.path, body.filename, body.caption);
                break;
                
            case 'send-image':
                // Verificar se imagem existe antes de enviar
                if (!require('fs').existsSync(body.path)) {
                    console.error(`❌ Imagem não encontrada: ${body.path}`);
                    return false;
                }
                result = await wppClient.sendImage(phone, body.path, body.filename || 'image.png', body.caption || '');
                break;
                
            case 'send-sticker-gif':
                // Verificar se GIF existe antes de enviar
                if (!require('fs').existsSync(body.path)) {
                    console.error(`❌ GIF não encontrado: ${body.path}`);
                    return false;
                }
                result = await wppClient.sendImageAsStickerGif(phone, body.path);
                break;
                
            case 'send-video':
                // Verificar se vídeo existe antes de enviar
                if (!require('fs').existsSync(body.path)) {
                    console.error(`❌ Vídeo não encontrado: ${body.path}`);
                    return false;
                }
                result = await wppClient.sendFile(phone, body.path, body.filename || 'video.mp4', body.caption || '');
                break;
                
            default:
                return false;
        }
        
        console.log(`✅ ${endpoint}: ${Date.now() - sendStart}ms`);
        return result;
        
    } catch (error) {
        const duration = Date.now() - sendStart;
        console.error(`❌ ${endpoint} (${duration}ms):`, error.message);
        
        // Log mais detalhado para erros de mídia
        if (endpoint.includes('file') || endpoint.includes('video') || endpoint.includes('image')) {
            console.error(`   Detalhes do erro de mídia:`, {
                path: body.path,
                filename: body.filename,
                exists: body.path ? require('fs').existsSync(body.path) : false
            });
        }
        
        // Se erro de conexão, tentar reconectar imediatamente
        if (error.message.includes('Protocol error') || 
            error.message.includes('Session closed') ||
            error.message.includes('Cannot read properties of undefined') ||
            error.message.includes('Target closed') ||
            error.message.includes('Connection failed')) {
            console.log('🔄 Erro de conexão detectado, reconectando...');
            reconectando = false;
            instanciaAtiva = false;
            setTimeout(() => {
                inicializarBot();
            }, 500);
        }
        
        return false;
    }
}

module.exports = { sendMessage, setWppClient, processarMensagem, verificarMensagemDuplicada };