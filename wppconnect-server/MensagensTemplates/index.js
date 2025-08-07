const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('./BancoDeDados/database');
const Message = require('./BancoDeDados/models/message');
const Contato = require('./BancoDeDados/models/contato');  

// Conectar ao banco e sincronizar models
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco de dados conectado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
  }
})();

console.log('🚀 Iniciando bot WhatsApp...');

wppconnect
  .create({
    session: 'NERDWHATS_AMERICA',
    headless: true,
    catchQR: (base64Qr, asciiQR) => {
      console.log('\n📱 QR CODE:');
      console.log(asciiQR);
    },
    statusFind: (status) => {
      console.log('📶 Status da conexão:', status);
      
      const statusMessages = {
        'isLogged': '✅ Conectado com sucesso!',
        'notLogged': '❌ Não conectado - Escaneie o QR Code',
        'browserClose': '🔄 Navegador fechado - Reconectando...',
        'qrReadSuccess': '✅ QR Code lido com sucesso!',
        'qrReadFail': '❌ Falha ao ler QR Code - Tente novamente',
        'autocloseCalled': '🔄 Sessão encerrada automaticamente',
        'desconnectedMobile': '📱 Celular desconectado',
        'deleteToken': '🗑️ Token removido',
        'chatsAvailable': '💬 Chats disponíveis',
        'deviceNotConnected': '📱 Dispositivo não conectado'
      };
      
      if (statusMessages[status]) {
        console.log(statusMessages[status]);
      }
    },
    onLoadingScreen: (percent, message) => {
      console.log(`⏳ Carregando: ${percent}% - ${message}`);
    }
  })
  .then((client) => {
    console.log('🎉 Bot iniciado com sucesso!');
    start(client);
  })
  .catch((err) => {
    console.error('❌ Erro ao iniciar WPPConnect:', err);
    console.log('🔄 Tentando reconectar em 5 segundos...');
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  });

async function start(client) {
  client.onMessage(async (message) => {
    const sender = message.from.replace('@c.us', '');
    const text = message.body?.toLowerCase() || '';

    // VERIFICA SE O NÚMERO ESTÁ NA TABELA DE CONTATOS
    const contato = await Contato.findOne({ where: {telefone: sender } });
    if (!contato) {
      console.log(`Número ${sender} não está autorizado (não está no banco). Ignorando.`);
      return; // NÃO VAI RESPONDER SE NÃO ESTIVER NO BANCO
    }

    console.log(`📩 Mensagem recebida de ${sender} (${contato.nome}): ${text}`);

    if (message.isGroupMsg) return;

    // SALVA A MENSAGEM NO BANCO
    try {
      await Message.create({
        sender,
        body: text,
      });
    } catch (err) {
      console.error('Erro ao salvar mensagem no banco:', err.message);
    }

    if (text === 'oi') {
      await sendMessage(sender, 'send-list-message', {
        title: 'Bem-vindo!',
        description: 'Escolha o que deseja receber:',
        buttonText: 'Ver opções',
        listType: 'SINGLE_SELECT',
        sections: [
          {
            title: 'Conteúdo disponível',
            rows: [
              {
                id: 'receber_imagem',
                title: '📷 Receber Imagem',
                description: '',
              },
              {
                id: 'receber_video',
                title: '🎥 Receber Vídeo',
                description: '',
              },
              {
                id: 'receber_pdf',
                title: '📄 Receber PDF',
                description: '',
              },
            ],
          },
        ],
      });
      return;
    }

    if (text.includes('📷 receber imagem')) {
      await sendMessage(sender, 'send-file', {
        path: './media/foto.jpg',
        filename: 'foto.jpg',
        caption: '📷 Aqui está sua imagem!',
      });
      return;
    }

    if (text.includes('🎥 receber vídeo')) {
      await sendMessage(sender, 'send-file', {
        path: './media/video.mp4',
        filename: 'video.mp4',
        caption: '🎥 Aqui está seu vídeo!',
      });
      return;
    }

    if (text.includes('📄 receber pdf')) {
      await sendMessage(sender, 'send-file', {
        path: './media/treinamento.pdf',
        filename: 'pdf.pdf',
        caption: '📄 Aqui está seu PDF!',
      });
      return;
    }

      await sendMessage(sender, 'send-message', {
      message: `👋 Olá, ${contato.nome}! Digite *oi* para ver as opções disponíveis.`,
    })
  });
}
