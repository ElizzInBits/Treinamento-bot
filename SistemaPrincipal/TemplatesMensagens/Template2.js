const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const ContatoModel = require('../BancoDeDados/models/contato');
const treinamentoSSMA = require('./Treinamentos/LCM/treinamentoSSMA');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');

// Cache para controle de mensagens duplicadas
const mensagensProcessando = new Map();

// Função para verificar e controlar mensagens duplicadas
function verificarMensagemDuplicada(sender, text) {
    const agora = Date.now();
    
    // Verificar se há mensagem similar sendo processada nos últimos 30 segundos
    const chavesExistentes = Array.from(mensagensProcessando.keys());
    for (const chave of chavesExistentes) {
        const [senderChave, textoChave, timestampChave] = chave.split('_');
        if (senderChave === sender && textoChave === text && (agora - parseInt(timestampChave)) < 30000) {
            console.log(`🔄 Mensagem duplicada detectada de ${sender}: "${text}" - ignorando`);
            return true; // É duplicada
        }
        // Limpar mensagens antigas (mais de 60 segundos)
        if ((agora - parseInt(timestampChave)) > 60000) {
            mensagensProcessando.delete(chave);
        }
    }
    
    // Marcar mensagem como sendo processada
    const chaveMsg = `${sender}_${text}_${agora}`;
    mensagensProcessando.set(chaveMsg, true);
    console.log(`✅ Processando mensagem de ${sender}: "${text}"`);
    
    // Remover da lista após 45 segundos
    setTimeout(() => {
        mensagensProcessando.delete(chaveMsg);
    }, 45000);
    
    return false; // Não é duplicada
}

// Inicializar modelo
let Contato = null;



// Cliente WhatsApp direto
let wppClient = null;

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    Contato = ContatoModel(sequelize);
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
  
  // Verificar se é comando de restart
  if (mensagem.toLowerCase().includes('restart') || mensagem.toLowerCase().includes('reiniciar')) {
    console.log(`🔄 COMANDO RESTART de ${telefone} - Limpando cache e reiniciando bot`);
    
    // Limpar todo o cache de duplicação
    mensagensProcessando.clear();
    
    // Enviar confirmação
    await client.sendText(message.from, '🔄 *Sistema reiniciado com sucesso!*\n\nCache limpo e bot reiniciado. Você pode começar uma nova conversa.');
    
    // Reinicializar o bot após um delay
    setTimeout(() => {
      inicializarBot();
    }, 2000);
    
    return;
  }
  
  // Verificar se é mensagem duplicada
  if (verificarMensagemDuplicada(telefone, mensagem)) {
    return; // Ignorar mensagem duplicada
  }
  
  try {
    // Verificar se o modelo está carregado
    if (!Contato) {
      console.log('⚠️ Modelo Contato não carregado, enviando resposta genérica');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    // Buscar contato no banco - formatos mais comuns
    const formatosTelefone = [
      telefone,                           // 553399595511
      telefone.substring(2),              // 3399595511  
      `${telefone.substring(0, 4)}9${telefone.substring(4)}`, // 5533999595511 (adicionar 9)
      telefone.length === 13 ? telefone.substring(0, 4) + telefone.substring(5) : telefone, // 5533999595511 -> 553399595511 (remover 9º dígito)
    ];
    
    let contato = null;
    for (const formato of formatosTelefone) {
      contato = await Contato.findOne({ where: { telefone: formato } });
      if (contato) {
        console.log(`✅ Contato encontrado: ${contato.nome} (formato: ${formato})`);
        break;
      }
    }
    
    if (!contato) {
      console.log(`❌ Contato não encontrado: ${telefone}`);
    }
    
    console.log(`📋 RESULTADO:`, contato ? `${contato.nome}` : 'NÃO ENCONTRADO');
    
    // Função sendMessage para usar com treinamento
    const sendMessageForTraining = async (phone, endpoint, body) => {
      return await sendMessage(phone, endpoint, body);
    };
    
    if (!contato) {
      // Usar treinamento de apresentação para contatos não cadastrados
      console.log('🚀 Iniciando fluxo de apresentação para contato não cadastrado');
      await treinamentoApresentacao.processarRespostaApresentacao(telefone, mensagem, message.selectedRowId, null, sendMessageForTraining);
      return;
    }
    
    // Recarregar contato do banco para ter status atualizado
    await contato.reload();
    
    console.log(`🎯 Processando mensagem: "${mensagem}" para ${contato.nome} (Status: ${contato.statusTreinamento})`);
    
    // PARAR IMEDIATAMENTE se treinamento concluído
    if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
      console.log('🚫 BLOQUEADO - Treinamento já concluído');
      return;
    }
    
    // Verificar se é seleção do menu de treinamentos
    if (message.selectedRowId === 'ssma_basico' || mensagem.toLowerCase().includes('treinamento básico de ssma')) {
      // Verificar se já concluiu o treinamento
      if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
        await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento SSMA com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        return;
      }
      console.log('🚀 Iniciando treinamento SSMA');
      await treinamentoSSMA.executarTreinamento(telefone, contato, sendMessageForTraining);
      return;
    }
    
    // Verificar se é seleção do treinamento de apresentação
    if (message.selectedRowId === 'apresentacao_basica' || mensagem.toLowerCase().includes('treinamento de apresentação')) {
      // Verificar se já concluiu o treinamento
      if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
        await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento de Apresentação com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        return;
      }
      console.log('🚀 Iniciando treinamento de Apresentação');
      await treinamentoApresentacao.iniciarTreinamentoApresentacao(telefone, sendMessageForTraining);
      return;
    }
    
    // Verificar se é comando de treinamento SSMA
    if (mensagem.toLowerCase().includes('ssma')) {
      // Verificar se já concluiu o treinamento
      if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
        await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento SSMA com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        return;
      }
      console.log('🚀 Iniciando treinamento SSMA');
      await treinamentoSSMA.executarTreinamento(telefone, contato, sendMessageForTraining);
      return;
    }
    
    // Verificar se é comando de treinamento de apresentação
    if (mensagem.toLowerCase().includes('apresentação') || mensagem.toLowerCase().includes('apresentacao')) {
      // Verificar se já concluiu o treinamento
      if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
        await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento de Apresentação com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        return;
      }
      console.log('🚀 Iniciando treinamento de Apresentação');
      await treinamentoApresentacao.iniciarTreinamentoApresentacao(telefone, sendMessageForTraining);
      return;
    }
    
    // Verificar se treinamento foi concluído ANTES de processar
    if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
      console.log('✅ Treinamento já concluído - não processando mensagens');
      await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento SSMA com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
      return;
    }
    
    // Sempre processar treinamento de apresentação para contatos cadastrados
    console.log('🚀 Processando treinamento de apresentação para contato cadastrado');
    await treinamentoApresentacao.processarRespostaApresentacao(telefone, mensagem, message.selectedRowId, contato, sendMessageForTraining);
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
    await client.sendText(message.from, '❌ Desculpe, ocorreu um erro. Tente novamente em alguns instantes.');
  }
}

// Função para definir cliente
function setWppClient(client) {
    wppClient = client;
}

// Variável para controlar reconexões
let reconectando = false;

// Função para limpar arquivos de lock
function limparLockFiles() {
  try {
    const fs = require('fs');
    const path = require('path');
    const lockPath = path.join(__dirname, 'tokens', 'WHATSAPP_BOT_DIRECT', 'SingletonLock');
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log('🧹 Arquivo de lock removido');
    }
  } catch (error) {
    console.log('⚠️ Erro ao limpar lock:', error.message);
  }
}

// Função para inicializar o bot com reconexão automática
async function inicializarBot() {
  if (reconectando) {
    console.log('⏳ Reconexão já em andamento, aguardando...');
    return;
  }
  
  reconectando = true;
  limparLockFiles();
  
  try {
    const client = await wppconnect.create({
      session: 'WHATSAPP_BOT_DIRECT',
      headless: 'new',
      disableWelcome: true,
      updatesLog: false,
      autoClose: 0,
      puppeteerOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--single-process'
        ],
        protocolTimeout: 300000
      },
      catchQR: (base64Qr, asciiQR) => {
        console.log('\n📱 QR CODE Bot Cliente:');
        console.log(asciiQR);
      },
      statusFind: (status) => {
        console.log('📶 Bot Cliente Status:', status);
      }
    });
    
    wppClient = client;
    setWppClient(client);
    reconectando = false;
    console.log('✅ Bot Cliente conectado!');
    
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
    
  } catch (error) {
    console.error('❌ Erro Bot Cliente:', error);
    reconectando = false;
    console.log('🔄 Tentando reconectar em 15 segundos...');
    setTimeout(() => {
      inicializarBot();
    }, 15000);
  }
}

// Inicializar o bot
inicializarBot();

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
                result = await wppClient.sendFile(phone, body.path, body.filename, body.caption);
                break;
                
            case 'send-image':
                result = await wppClient.sendImage(phone, body.path, body.filename || 'image.png', body.caption || '');
                break;
                
            case 'send-sticker-gif':
                result = await wppClient.sendImageAsStickerGif(phone, body.path);
                break;
                
            case 'send-video':
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
        
        // Se erro de conexão, tentar reconectar
        if (error.message.includes('Protocol error') || error.message.includes('Session closed')) {
            console.log('🔄 Erro de protocolo detectado, reconectando...');
            inicializarBot();
        }
        
        return false;
    }
}

module.exports = { sendMessage, setWppClient, processarMensagem, verificarMensagemDuplicada };