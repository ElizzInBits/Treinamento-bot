const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const ContatoModel = require('../BancoDeDados/models/contato');
const treinamentoSSMA = require('./Treinamentos/LCM/treinamentoSSMA');
const treinamentoApresentacao = require('./Treinamentos/Apresentacao/treinamentoApresentacao');

// Inicializar modelo
let Contato = null;

// Cache simples para contatos
const contatoCache = new Map();

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
  
  try {
    // Verificar se o modelo está carregado
    if (!Contato) {
      console.log('⚠️ Modelo Contato não carregado, enviando resposta genérica');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    // Cache simples para evitar consultas repetidas
    const cacheKey = `contato_${telefone}`;
    let contato = contatoCache.get(cacheKey);
    
    if (!contato) {
      // Buscar contato no banco - formatos mais comuns primeiro
      const formatosTelefone = [
        telefone,                           // 553399595511
        telefone.substring(2),              // 3399595511  
        `${telefone.substring(0, 4)}9${telefone.substring(4)}`, // 5533999595511 (adicionar 9)
      ];
      
      for (const formato of formatosTelefone) {
        contato = await Contato.findOne({ where: { telefone: formato } });
        if (contato) {
          console.log(`✅ Contato encontrado com formato: ${formato}`);
          contatoCache.set(cacheKey, contato);
          break;
        }
        console.log(`❌ Tentativa: ${formato}`);
      }
    }
    
    console.log(`📋 RESULTADO FINAL:`, contato ? `${contato.nome} (ID: ${contato.id})` : 'NÃO ENCONTRADO');
    
    // Debug: mostrar alguns contatos do banco
    if (!contato) {
      const todosContatos = await Contato.findAll({ limit: 5 });
      console.log('📋 Exemplos de contatos no banco:');
      todosContatos.forEach(c => console.log(`  - ${c.telefone} (${c.nome})`));
      
      // Tentar buscar por parte do número
      const buscaParcial = await Contato.findAll({ 
        where: { 
          telefone: { 
            [require('sequelize').Op.like]: `%${telefone.slice(-8)}%` 
          } 
        },
        limit: 3
      });
      console.log('🔍 Busca parcial (8 últimos dígitos):');
      buscaParcial.forEach(c => console.log(`  - ${c.telefone} (${c.nome})`));
    }
    
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
    
    // Verificar qual treinamento está ativo baseado no treinamentoId
    if (contato.treinamentoId === 14) {
      // Tentar processar resposta do treinamento SSMA
      console.log('🔄 Tentando processar resposta SSMA');
      const processouSSMA = await treinamentoSSMA.processarRespostaSSMA(telefone, mensagem, message.selectedRowId, contato, sendMessageForTraining);
      if (processouSSMA) {
        console.log('✅ Resposta SSMA processada');
        return;
      }
    } else if (contato.treinamentoId === 15) {
      // Tentar processar resposta do treinamento de apresentação
      console.log('🔄 Tentando processar resposta Apresentação');
      const processouApresentacao = await treinamentoApresentacao.processarRespostaApresentacao(telefone, mensagem, message.selectedRowId, contato, sendMessageForTraining);
      if (processouApresentacao) {
        console.log('✅ Resposta Apresentação processada');
        return;
      }
    }
    console.log('⚠️ Resposta não processada, enviando resposta padrão');
    
    // Usar treinamento de apresentação para contatos cadastrados também
    console.log('🚀 Iniciando fluxo de apresentação para contato cadastrado');
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

// Cliente direto ativado
wppconnect.create({
  session: 'WHATSAPP_BOT_DIRECT',
  headless: true,
  disableWelcome: true,
  updatesLog: false,
  autoClose: 0,
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  },
  catchQR: (base64Qr, asciiQR) => {
    console.log('\n📱 QR CODE Bot Cliente:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 Bot Cliente Status:', status);
  }
}).then(c => {
  wppClient = c;
  setWppClient(c);
  console.log('✅ Bot Cliente conectado!');
  
  // Listener de mensagens
  c.onMessage(async (message) => {
    if (!message.body) return;
    if (message.isGroupMsg) return;
    if (message.fromMe) return;
    
    console.log('📨 Mensagem recebida:', message.body, 'de:', message.from);
    
    try {
      await processarMensagem(message, c);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error.message);
    }
  });
  
  // Bloqueador de chamadas
  c.onIncomingCall(async (call) => {
    console.log('📞 Chamada recebida de:', call.peerJid);
    try {
      await c.rejectCall(call.id);
      await c.sendText(call.peerJid, '🚫 *Chamadas não são aceitas*\n\nEnvie mensagem de texto! 😊');
      console.log('✅ Chamada bloqueada');
    } catch (error) {
      console.error('❌ Erro ao bloquear:', error.message);
    }
  });
  
}).catch(err => {
  console.error('❌ Erro Bot Cliente:', err);
});

// Função sendMessage usando cliente direto
async function sendMessage(phone, endpoint, body = {}) {
    const sendStart = Date.now();
    
    if (!wppClient) {
        console.error('❌ Cliente WhatsApp não definido');
        return false;
    }
    
    try {
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
        return false;
    }
}

module.exports = { sendMessage, setWppClient, processarMensagem };