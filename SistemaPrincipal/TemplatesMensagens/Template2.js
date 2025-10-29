require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const { Usuario } = require('../BancoDeDados/models');
const treinamentoSSMA = require('./Treinamentos/LCM/treinamentoSSMA');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');
const sistemaIdentificacao = require('./sistemaIdentificacao');
const mantenedorSessao = require('./manterSessao');
const { createSharedLogger } = require('../utils/shared-logger');

// Logger específico para WhatsApp Bot
const logger = createSharedLogger('whatsapp-bot');

// Inicializar sistema de limpeza de certificados
require('./Certificados/limpezaCertificados');

// Inicializar limpeza automática do banco
require('../BancoDeDados/scripts/limpezaAutomatica');



// Cliente WhatsApp direto
let wppClient = null;

// Controle de mensagens duplicadas
const mensagensProcessando = new Map();
const TIMEOUT_DUPLICADA = 5000; // 5 segundos

// Controle de usuários ocupados (buscando certificados, etc)
const usuariosOcupados = new Map();

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    logger.info('Banco conectado - Template2');
  } catch (error) {
    logger.error('Erro no banco - Template2', { error: error.message });
  }
})();

// Função para processar mensagens
async function processarMensagem(message, client) {
  const telefone = message.from.replace('@c.us', '');
  const mensagem = message.body.trim();
  
  logger.info('Processando mensagem', { telefone, mensagem: mensagem.substring(0, 100) });
  
  // Verificar se usuário está ocupado
  if (usuariosOcupados.has(telefone)) {
    const operacao = usuariosOcupados.get(telefone);
    await client.sendText(message.from, `⏳ *Aguarde um momento...*\n\nEstou ${operacao}, só mais um instante!`);
    return;
  }
  
  // Comando para solicitar certificados
  if (mensagem.toLowerCase() === '#meus_certificados' || mensagem.toLowerCase() === 'meus certificados') {
    logger.info('Comando MEUS_CERTIFICADOS executado', { telefone });
    await enviarCertificadosUsuario(telefone, sendMessage);
    return;
  }
  
  // Comando MENU para mostrar treinamentos pendentes
  if (mensagem.toLowerCase() === 'menu') {
    logger.info('Comando MENU executado', { telefone });
    await mostrarMenuTreinamentos(telefone, sendMessage);
    return;
  }
  
  // Comando 5 para falar com comercial
  if (mensagem.trim() === '5') {
    logger.info('Comando COMERCIAL (5) executado', { telefone });
    await client.sendText(message.from, '🎉 *Perfeito!*\n\nVou te conectar com nosso time comercial agora mesmo!\n\n👉 Clique no link abaixo para falar diretamente com nossa equipe:\n\nhttps://wa.me/553195095646?text=Olá%2C%20vim%20pelo%20assistente%20virtual%20de%20treinamentos.\n\n🚀 Obrigada por conhecer o futuro dos treinamentos normativos!');
    return;
  }
  
  // Comando 6 para falar com suporte
  if (mensagem.trim() === '6') {
    logger.info('Comando SUPORTE (6) executado', { telefone });
    await client.sendText(message.from, '👨‍💻 *Suporte Técnico*\n\nVou te conectar com nossa equipe de suporte!\n\n👉 Clique no link abaixo para receber ajuda:\n\nhttps://wa.me/553131669006?text=Olá!%20Vim%20pelo%20assistente%20virtual%20de%20treinamentos%20e%20gostaria%20de%20receber%20ajuda%20com%20algo.\n\n✨ Nossa equipe está pronta para ajudar!');
    return;
  }
  
  // Verificar comandos especiais
  if (mensagem.toLowerCase().includes('restart') || mensagem.toLowerCase().includes('reiniciar')) {
    logger.warn('Comando RESTART executado', { telefone });
    mensagensProcessando.clear();
    logger.info('Cache de mensagens duplicadas limpo');
    await client.sendText(message.from, '🔄 *Sistema reiniciado!*\n\nCache limpo. Você pode continuar.');
    setTimeout(() => inicializarBot(), 2000);
    return;
  }
  
  if (mensagem.toLowerCase().includes('limpar sessao') || mensagem.toLowerCase().includes('reset sessao')) {
    logger.warn('Comando LIMPAR SESSÃO executado', { telefone });
    mantenedorSessao.limparSessao();
    await client.sendText(message.from, '🧹 *Sessão limpa!*\n\nVocê precisará escanear o QR Code novamente.');
    setTimeout(() => {
      process.exit(0); // Forçar restart completo
    }, 1000);
    return;
  }
  
  if (mensagem.toLowerCase().includes('status sessao')) {
    logger.info('Comando STATUS SESSÃO executado', { telefone });
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
  
  // Salvar mensagem do usuário no banco
  try {
    const { Interacao } = require('../BancoDeDados/models');
    await Interacao.create({
      telefone: telefone,
      tipo: 'mensagem_usuario',
      mensagem: JSON.stringify({ body: mensagem, from: message.from, timestamp: Date.now() })
    });
  } catch (error) {
    logger.error('Erro ao salvar mensagem do usuário', { error: error.message });
  }
  
  try {
    // Verificar se o modelo está carregado
    if (!Usuario) {
      logger.warn('Modelo Usuario não carregado, enviando resposta genérica');
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
          logger.info('Contato encontrado', { nome: contato.nome, telefone: formato });
          return contato;
        }
      }
      
      logger.warn('Contato não encontrado', { telefone });
      return null;
    };
    
    // Usar sistema de identificação para determinar o fluxo
    logger.debug('Processando através do sistema de identificação', { telefone });
    await sistemaIdentificacao.processarMensagemInicial(telefone, mensagem, sendMessageForTraining, buscarContato);
    

  } catch (error) {
    logger.error('Erro ao processar mensagem', { error: error.message, telefone, stack: error.stack });
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
      logger.debug('Mensagem duplicada ignorada', { telefone, mensagem: mensagem.substring(0, 50) });
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
        protocolTimeout: 900000, // 15 minutos
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
      if (message.from === 'status@broadcast') return; // Ignorar status do WhatsApp
      
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
        logger.error('Cliente WhatsApp não definido');
        return false;
    }
    
    try {
        // Verificar se o cliente ainda está conectado
        const state = await wppClient.getConnectionState().catch(() => 'DISCONNECTED');
        if (state !== 'CONNECTED') {
            logger.warn('Cliente desconectado, tentando reconectar');
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
        
        logger.debug('Mensagem enviada', { endpoint, duration: Date.now() - sendStart, phone });
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

// Função para enviar certificados do usuário
async function enviarCertificadosUsuario(telefone, sendMessageFunc) {
  // Marcar usuário como ocupado
  usuariosOcupados.set(telefone, 'buscando seus certificados');
  
  try {
    const { Usuario, AssinaturaCertificado } = require('../BancoDeDados/models');
    
    // Buscar usuário
    const formatosTelefone = [
      telefone,
      telefone.substring(2),
      `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
      telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
    ];
    
    let usuario = null;
    for (const formato of formatosTelefone) {
      usuario = await Usuario.findOne({ where: { telefone: formato } });
      if (usuario) break;
    }
    
    if (!usuario) {
      await sendMessageFunc(telefone, 'send-message', { message: '❌ Usuário não encontrado no sistema.' });
      return;
    }
    
    // Buscar certificados assinados
    const certificados = await AssinaturaCertificado.findAll({
      where: {
        usuarioId: usuario.id,
        status: 'assinado'
      },
      order: [['assinadoEm', 'DESC']]
    });
    
    if (certificados.length === 0) {
      await sendMessageFunc(telefone, 'send-message', { message: '📜 Você ainda não possui certificados assinados.' });
      return;
    }
    
    // Enviar mensagem inicial
    await sendMessageFunc(telefone, 'send-message', { 
      message: `🎓 *Seus Certificados Assinados (${certificados.length}):*

⏳ Só um momento que vou buscar eles...` 
    });
    
    // Enviar cada certificado com link individual
    const AssinaturaCertificadoService = require('./Certificados/assinaturaCertificado');
    const { Treinamento } = require('../BancoDeDados/models');
    
    for (const cert of certificados) {
      const [treinamentoId] = cert.tokenAssinatura.split('_');
      const dataAssinatura = new Date(cert.assinadoEm).toLocaleDateString('pt-BR');
      
      // Buscar nome do treinamento
      const treinamento = await Treinamento.findByPk(parseInt(treinamentoId));
      const nomeTreinamento = treinamento ? treinamento.nome : `Treinamento ${treinamentoId}`;
      
      // Encurtar link
      const linkCompleto = `http://72.60.48.249:3000/assinar-certificado/${cert.tokenAssinatura}`;
      const linkEncurtado = await AssinaturaCertificadoService.encurtarUrl(linkCompleto);
      
      const mensagemCert = `✅ *${nomeTreinamento}*\n📅 Assinado em: ${dataAssinatura}\n🔗 ${linkEncurtado}`;
      
      await sendMessageFunc(telefone, 'send-message', { message: mensagemCert });
      
      // Pequeno delay entre mensagens
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Mensagem final
    await sendMessageFunc(telefone, 'send-message', { 
      message: '📌 *Dica:* Clique no link de cada certificado para visualizar e baixar!' 
    });
    
  } catch (error) {
    logger.error('Erro ao enviar certificados', { error: error.message });
    await sendMessageFunc(telefone, 'send-message', { message: '❌ Erro ao buscar certificados. Tente novamente.' });
  } finally {
    // Liberar usuário
    usuariosOcupados.delete(telefone);
  }
}

// Função centralizada para gerar certificados com tratamento de erro
async function gerarCertificadoComAssinatura(usuarioId, treinamentoNomeArquivo, treinamentoId, sendMessageFunc, destinatario) {
  try {
    const { gerarCertificadoBanco } = require('./Certificados/certificados2');
    const TreinamentoUtils = require('./Treinamentos/treinamento-utils');
    
    // Gerar certificado
    const caminhoArquivo = await gerarCertificadoBanco(usuarioId, null, treinamentoId);
    
    if (!caminhoArquivo) {
      await sendMessageFunc(destinatario, 'send-message', {
        message: '❌ Erro ao gerar certificado. Tente novamente.'
      });
      return { sucesso: false, erro: 'Erro ao gerar certificado' };
    }
    
    // Verificar se já existe certificado assinado ANTES de tentar criar token
    const { AssinaturaCertificado: AssinaturaModel } = require('../BancoDeDados/models');
    const certificadoExistente = await AssinaturaModel.findOne({
      where: {
        usuarioId: usuarioId,
        status: 'assinado'
      },
      order: [['assinadoEm', 'DESC']]
    });
    
    if (certificadoExistente) {
      const tokenParts = certificadoExistente.tokenAssinatura.split('_');
      const treinamentoIdToken = parseInt(tokenParts[0]);
      
      if (treinamentoIdToken === treinamentoId) {
        const linkCertificado = `http://72.60.48.249:3000/assinar-certificado/${certificadoExistente.tokenAssinatura}`;
        const AssinaturaCertificadoService = require('./Certificados/assinaturaCertificado');
        const linkEncurtado = await AssinaturaCertificadoService.encurtarUrl(linkCertificado);
        
        await sendMessageFunc(destinatario, 'send-message', {
          message: `✅ *Você já concluiu este treinamento!*\n\n🎓 Seu certificado já foi assinado anteriormente.\n\n🔗 *Acesse seu certificado:*\n${linkEncurtado}\n\n📜 Você pode baixar o certificado a qualquer momento!`
        });
        return { sucesso: false, erro: 'Certificado já assinado', jaAssinado: true, linkCertificado: linkEncurtado };
      }
    }
    
    try {
      // Criar token de assinatura
      const resultado = await TreinamentoUtils.criarTokenCertificadoTreinamento(
        usuarioId,
        treinamentoNomeArquivo,
        caminhoArquivo
      );
      
      const linkAssinatura = resultado.linkAssinatura;
      
      if (resultado && linkAssinatura) {
        return {
          sucesso: true,
          linkAssinatura: linkAssinatura,
          caminhoArquivo: caminhoArquivo
        };
      } else {
        await sendMessageFunc(destinatario, 'send-message', {
          message: '❌ Erro ao criar link de assinatura. Tente novamente.'
        });
        return { sucesso: false, erro: 'Erro ao criar link' };
      }
    } catch (tokenError) {
      // Se chegou aqui, é um erro diferente
      throw tokenError;
    }
  } catch (error) {
    logger.error('Erro ao gerar certificado com assinatura', { error: error.message });
    await sendMessageFunc(destinatario, 'send-message', {
      message: '❌ Erro interno ao gerar certificado. Tente novamente mais tarde.'
    });
    return { sucesso: false, erro: error.message };
  }
}

// Função para gerar menu padrão de treinamentos pendentes
function gerarMenuTreinamentosPendentes() {
  return '\n👉 *O que você gostaria de fazer?*\n\n' +
         '1️⃣ Fazer meus treinamentos agora\n' +
         '2️⃣ Ver como a ferramenta funciona\n' +
         '3️⃣ Acessar meus certificados\n' +
         '4️⃣ Lembrar depois\n' +
         '5️⃣ Falar com o comercial\n' +
         '6️⃣ Falar com o suporte';
}

// Função para mostrar menu de treinamentos quando usuário digita MENU
async function mostrarMenuTreinamentos(telefone, sendMessageFunc) {
  try {
    const { Usuario } = require('../BancoDeDados/models');
    const { encurtarNome } = require('./utils/formatarNome');
    
    // Buscar usuário
    const formatosTelefone = [
      telefone,
      telefone.substring(2),
      `${telefone.substring(0, 4)}9${telefone.substring(4)}`,
      telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone,
    ];
    
    let usuario = null;
    for (const formato of formatosTelefone) {
      usuario = await Usuario.findOne({ where: { telefone: formato } });
      if (usuario) break;
    }
    
    if (!usuario) {
      await sendMessageFunc(telefone, 'send-message', { 
        message: '❌ Usuário não encontrado no sistema. Faça seu cadastro em: https://abrir.link/ZEeCt' 
      });
      return;
    }
    
    // Buscar treinamentos pendentes
    const treinamentosPendentes = await treinamentoApresentacao.verificarTreinamentosEmpresa(usuario.empresaId, usuario.id);
    
    if (!treinamentosPendentes || treinamentosPendentes.length === 0) {
      let mensagem = `🎉 Parabéns, ${encurtarNome(usuario.nome)}! Você não possui treinamentos pendentes no momento.\n\n✅ Todos os seus treinamentos estão em dia!`;
      mensagem += gerarMenuTreinamentosPendentes();
      mensagem += '\n\n💡 *Dica:* Digite *MENU* a qualquer momento para voltar a este menu.';
      
      await sendMessageFunc(telefone, 'send-message', { message: mensagem });
      
      // Salvar interação
      const { Interacao } = require('../BancoDeDados/models');
      await Interacao.create({
        telefone: telefone,
        tipo: 'treinamentos_pendentes',
        mensagem: JSON.stringify({ 
          etapa: 'treinamentos_pendentes',
          treinamentos: [],
          contato_id: usuario.id,
          empresa_id: usuario.empresaId
        })
      });
      return;
    }
    
    // Montar mensagem com treinamentos pendentes
    let mensagem = `🎓 Ótimo ${encurtarNome(usuario.nome)}! Identifiquei que sua empresa tem treinamentos pendentes:\n\n`;
    
    treinamentosPendentes.forEach((treinamento) => {
      let icone = '⚠️';
      
      switch (treinamento.status_prazo) {
        case 'vencido':
          icone = '🔴';
          break;
        case 'urgente':
          icone = '🟡';
          break;
        case 'normal':
          icone = treinamento.tipo === 'reciclagem' ? '🔄' : '⚠️';
          break;
      }
      
      mensagem += `${icone} ${treinamento.nome}\n`;
    });
    
    mensagem += gerarMenuTreinamentosPendentes();
    mensagem += '\n\n💡 *Dica:* Digite *MENU* a qualquer momento para voltar a este menu.';
    
    await sendMessageFunc(telefone, 'send-message', { message: mensagem });
    
    // Salvar interação
    const { Interacao } = require('../BancoDeDados/models');
    await Interacao.create({
      telefone: telefone,
      tipo: 'treinamentos_pendentes',
      mensagem: JSON.stringify({ 
        etapa: 'treinamentos_pendentes',
        treinamentos: treinamentosPendentes,
        contato_id: usuario.id,
        empresa_id: usuario.empresaId
      })
    });
    
  } catch (error) {
    logger.error('Erro ao mostrar menu de treinamentos', { error: error.message });
    await sendMessageFunc(telefone, 'send-message', { 
      message: '❌ Erro ao buscar treinamentos. Tente novamente.' 
    });
  }
}

module.exports = { sendMessage, setWppClient, processarMensagem, verificarMensagemDuplicada, gerarCertificadoComAssinatura, enviarCertificadosUsuario, gerarMenuTreinamentosPendentes };