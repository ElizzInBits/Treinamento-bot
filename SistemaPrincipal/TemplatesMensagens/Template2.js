const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('../BancoDeDados/database');
const ContatoModel = require('../BancoDeDados/models/contato');
const treinamentoSSMA = require('./Treinamentos/LCM/treinamentoSSMA');

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
  
  try {
    // Verificar se o modelo está carregado
    if (!Contato) {
      console.log('⚠️ Modelo Contato não carregado, enviando resposta genérica');
      await client.sendText(message.from, '😊 Olá! Recebi sua mensagem. Nossa equipe entrará em contato em breve!');
      return;
    }
    
    // Buscar contato no banco - tentar TODOS os formatos possíveis
    const formatosTelefone = [
      telefone,                           // 553399595511
      `${telefone.substring(0, 4)}9${telefone.substring(4)}`, // 5533999595511 (adicionar 9)
      telefone.replace(/^(55\d{2})9/, '$1'), // 553399595511 -> 5533995511 (remover 9)
      telefone.substring(2),              // 3399595511  
      `${telefone.substring(2, 4)}9${telefone.substring(4)}`, // 33999595511 (DDD + 9)
      telefone.substring(2).replace(/^(\d{2})9/, '$1'), // 3399595511 -> 33995511 (remover 9 do DDD)
      `+${telefone}`,                     // +553399595511
      `+${telefone.substring(0, 4)}9${telefone.substring(4)}`, // +5533999595511
    ];
    
    let contato = null;
    for (const formato of formatosTelefone) {
      contato = await Contato.findOne({ where: { telefone: formato } });
      if (contato) {
        console.log(`✅ Contato encontrado com formato: ${formato}`);
        break;
      }
      console.log(`❌ Tentativa: ${formato}`);
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
    
    if (!contato) {
      // Mensagens de boas-vindas Salubritá - ORDEM CORRETA
      await client.sendText(message.from, '👋 Olá! Seja muito bem-vindo(a)!\n\n🤖 Eu sou um bot de treinamentos da Salubritá! 🚀');
      
      setTimeout(async () => {
        await client.sendText(message.from, '🏢 Estou aqui para aplicar treinamentos de segurança e saúde no trabalho de forma rápida e eficiente!\n\n🎓 Nossos treinamentos são certificados e reconhecidos nacionalmente.');
      }, 1000);
      
      setTimeout(async () => {
        try {
          await client.sendText(message.from, '🤔 Humm, parece que você ainda não fez seu cadastro em nossa plataforma.\n\n📝 Para iniciar seu treinamento, é necessário se cadastrar primeiro.\n\n👉 Clique no link abaixo para se cadastrar:\n\nhttps://abrir.link/kAgON\n\n✨ Após o cadastro, volte aqui e me envie qualquer mensagem para começarmos!');
          
          // SÓ DEPOIS que o link foi enviado, enviar as mensagens de ATENÇÃO
          setTimeout(async () => {
            await client.sendText(message.from, 'ATENÇÃO:\nUse o MESMO NÚMERO que você utilizará para conversar com o bot de treinamento no WhatsApp.');
            
            setTimeout(async () => {
              await client.sendText(message.from, '💡 Caso tenha feito cadastro com um número diferente desse, basta acessar novamente o painel de cadastro, rolar a tela até o final e acessar os seus dados para realizar a edição do número.');
            }, 1000);
          }, 1000);
          
        } catch (error) {
          console.error('❌ Erro ao enviar mensagem de cadastro:', error);
        }
      }, 2000);
      
      return;
    }
    
    // Função sendMessage para usar com treinamento
    const sendMessageForTraining = async (phone, endpoint, body) => {
      return await sendMessage(phone, endpoint, body);
    };
    
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
    
    // Verificar se é comando de treinamento SSMA
    if (mensagem.toLowerCase().includes('ssma') || mensagem.toLowerCase().includes('treinamento')) {
      // Verificar se já concluiu o treinamento
      if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
        await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento SSMA com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        return;
      }
      console.log('🚀 Iniciando treinamento SSMA');
      await treinamentoSSMA.executarTreinamento(telefone, contato, sendMessageForTraining);
      return;
    }
    
    // Verificar se treinamento foi concluído ANTES de processar
    if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
      console.log('✅ Treinamento já concluído - não processando mensagens');
      await client.sendText(message.from, `🎆 Olá ${contato.nome}!\n\n✅ Você já concluiu o treinamento SSMA com sucesso!\n\n📜 Caso precise revisar o conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
      return;
    }
    
    // Tentar processar resposta do treinamento SSMA
    console.log('🔄 Tentando processar resposta SSMA');
    const processouSSMA = await treinamentoSSMA.processarRespostaSSMA(telefone, mensagem, message.selectedRowId, contato, sendMessageForTraining);
    if (processouSSMA) {
      console.log('✅ Resposta SSMA processada');
      return;
    }
    console.log('⚠️ Resposta SSMA não processada, enviando resposta padrão');
    
    // Mensagem de boas-vindas para contatos cadastrados
    await client.sendText(message.from, `👋 Olá, ${contato.nome}! Seja bem-vindo(a)`);
    
    setTimeout(async () => {
      await client.sendText(message.from, '📚 Aqui estão os treinamentos disponíveis');
      
      setTimeout(async () => {
        // Verificar status do treinamento
        if (contato.statusTreinamento === 'concluído' || contato.statusTreinamento === 'concluido') {
          await client.sendText(message.from, `🎆 Parabéns ${contato.nome}!\n\n✅ Você já concluiu todos os treinamentos disponíveis!\n\n📜 Caso precise revisar algum conteúdo ou tenha dúvidas, entre em contato com nossa equipe.`);
        } else {
          // Enviar menu de treinamentos
          await client.sendListMessage(message.from, {
            title: 'Escolha qual treinamento deseja iniciar:',
            description: '',
            buttonText: 'Selecione uma opção:',
            sections: [{
              title: 'Treinamentos Disponíveis',
              rows: [{
                rowId: 'ssma_basico',
                title: 'Treinamento Básico de SSMA',
                description: 'Segurança, Saúde e Meio Ambiente'
              }]
            }]
          });
        }
      }, 1000);
    }, 1000);
    
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