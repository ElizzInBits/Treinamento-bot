const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');
const { 
  CALL_BLOCKER_CONFIG, 
  isNumberAllowed, 
  shouldSendMessage, 
  markMessageSent 
} = require('./call-blocker-config');

const app = express();
const PORT = 21465;

app.use(cors());
app.use(express.json());

let client = null;

// Inicializar cliente
wppconnect.create({
  session: 'WPPCONNECT_SERVER',
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
    console.log('\n📱 QR CODE WppConnect Server:');
    console.log(asciiQR);
  },
  statusFind: (status) => {
    console.log('📶 WppConnect Status:', status);
  }
}).then(c => {
  client = c;
  console.log('✅ WppConnect Server conectado!');
  
  // Configurar bloqueio de ligações
  setupCallBlocking(client);
  
  // Configurar processamento de mensagens
  setupMessageProcessing(client);
  
}).catch(err => {
  console.error('❌ Erro WppConnect:', err);
});

// Função para processar mensagens
function setupMessageProcessing(client) {
  if (!client) return;
  
  try {
    const { processarMensagem } = require('./SistemaPrincipal/TemplatesMensagens/Template2');
    
    client.onMessage(async (message) => {
      if (!message.body) return;
      if (message.isGroupMsg) return;
      if (message.fromMe) return;
      
      console.log('📨 Mensagem recebida no wppconnect-server:', message.body, 'de:', message.from);
      
      try {
        await processarMensagem(message, client);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem no server:', error.message);
      }
    });
    
    console.log('💬 Sistema de processamento de mensagens ativado!');
    
  } catch (error) {
    console.error('❌ Erro ao configurar processamento de mensagens:', error.message);
  }
}

// Função para bloquear ligações com configurações avançadas
function setupCallBlocking(client) {
  if (!client || !CALL_BLOCKER_CONFIG.enabled) {
    if (!CALL_BLOCKER_CONFIG.enabled) {
      console.log('⚠️ Bloqueio de ligações desabilitado na configuração');
    }
    return;
  }
  
  try {
    // Interceptar ligações recebidas
    client.onIncomingCall(async (call) => {
      const phoneNumber = call.peerJid.replace('@c.us', '');
      const isGroup = call.peerJid.includes('@g.us');
      
      if (CALL_BLOCKER_CONFIG.detailedLogging) {
        console.log(`📞 Ligação recebida de: ${phoneNumber} ${isGroup ? '(Grupo)' : '(Individual)'}`);
        console.log(`📋 Detalhes da ligação:`, {
          id: call.id,
          from: call.peerJid,
          isVideo: call.isVideo || false,
          timestamp: new Date().toISOString()
        });
      }
      
      // Verificar se deve bloquear ligações de grupo
      if (isGroup && !CALL_BLOCKER_CONFIG.blockGroupCalls) {
        console.log('📞 Ligação de grupo permitida pela configuração');
        return;
      }
      
      // Verificar whitelist
      const isAllowed = isNumberAllowed(phoneNumber);
      
      try {
        // Rejeitar a ligação automaticamente
        await client.rejectCall(call.id);
        
        if (CALL_BLOCKER_CONFIG.detailedLogging) {
          console.log(`❌ Ligação rejeitada: ${phoneNumber} ${isAllowed ? '(Whitelist)' : '(Bloqueada)'}`);
        }
        
        // Determinar qual mensagem enviar
        let mensagem;
        if (isAllowed && CALL_BLOCKER_CONFIG.whitelistMessage) {
          mensagem = CALL_BLOCKER_CONFIG.whitelistMessage;
        } else {
          mensagem = CALL_BLOCKER_CONFIG.blockedMessage;
        }
        
        // Verificar se deve enviar mensagem
        if (shouldSendMessage(call.peerJid)) {
          // Aguardar antes de enviar a mensagem
          setTimeout(async () => {
            try {
              await client.sendText(call.peerJid, mensagem);
              markMessageSent(call.peerJid);
              
              if (CALL_BLOCKER_CONFIG.detailedLogging) {
                console.log(`✅ Mensagem de bloqueio enviada para: ${phoneNumber}`);
              }
            } catch (msgError) {
              console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, msgError.message);
            }
          }, CALL_BLOCKER_CONFIG.messageDelay);
        } else {
          if (CALL_BLOCKER_CONFIG.detailedLogging) {
            console.log(`⏭️ Mensagem não enviada (já enviada hoje): ${phoneNumber}`);
          }
        }
        
      } catch (rejectError) {
        console.error(`❌ Erro ao rejeitar ligação de ${phoneNumber}:`, rejectError.message);
      }
    });
    
    console.log('🛡️ Sistema de bloqueio de ligações ativado com configurações avançadas!');
    console.log(`📊 Configurações ativas:`);
    console.log(`   • Bloqueio habilitado: ${CALL_BLOCKER_CONFIG.enabled}`);
    console.log(`   • Bloqueio de grupos: ${CALL_BLOCKER_CONFIG.blockGroupCalls}`);
    console.log(`   • Números permitidos: ${CALL_BLOCKER_CONFIG.allowedNumbers.length}`);
    console.log(`   • Uma mensagem por dia: ${CALL_BLOCKER_CONFIG.oncePerDay}`);
    console.log(`   • Delay da mensagem: ${CALL_BLOCKER_CONFIG.messageDelay}ms`);
    
  } catch (error) {
    console.error('❌ Erro ao configurar bloqueio de ligações:', error.message);
  }
}

// Rotas da API
app.get('/status', async (req, res) => {
  if (!client) {
    return res.json({ 
      status: 'disconnected',
      session: 'WPPCONNECT_SERVER'
    });
  }
  
  try {
    const isConnected = await client.isConnected();
    res.json({ 
      status: isConnected ? 'connected' : 'disconnected',
      session: 'WPPCONNECT_SERVER'
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      error: error.message
    });
  }
});

// Rota para gerar token (API padrão wppconnect)
app.post('/api/:session/:token/generate-token', async (req, res) => {
  const { session, token } = req.params;
  
  if (token !== '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  try {
    const newToken = Math.random().toString(36).substring(2, 15);
    res.json({ 
      success: true,
      token: newToken,
      session: session
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para status da sessão (API padrão)
app.get('/api/:session/:token/status', async (req, res) => {
  const { session, token } = req.params;
  
  if (token !== '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  if (!client) {
    return res.json({ 
      status: 'disconnected',
      session: session
    });
  }
  
  try {
    const isConnected = await client.isConnected();
    res.json({ 
      status: isConnected ? 'connected' : 'disconnected',
      session: session
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      error: error.message
    });
  }
});

// Rota para enviar mensagem (API padrão)
app.post('/api/:session/:token/send-message', async (req, res) => {
  const { session, token } = req.params;
  
  if (token !== '$2b$10$QJj4k9BAruwyrQDV9QWKG.miYnqybtAg9BFlDeAknsAglzsndDivu') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  if (!client) {
    return res.status(400).json({ error: 'Cliente não conectado' });
  }
  
  try {
    const { phone, message } = req.body;
    const result = await client.sendText(`${phone}@c.us`, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/send-message', async (req, res) => {
  if (!client) {
    return res.status(400).json({ error: 'Cliente não conectado' });
  }
  
  try {
    const { phone, message } = req.body;
    const result = await client.sendText(`${phone}@c.us`, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WppConnect Server ATIVO na porta ${PORT}`);
  console.log(`🔗 Acesse: http://72.60.48.249:${PORT}/status`);
  console.log(`🔗 Teste: curl http://localhost:${PORT}/status`);
});

// Rota de teste simples
app.get('/test', (req, res) => {
  res.json({ 
    message: 'WppConnect Server funcionando!',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    service: 'WppConnect Server',
    status: 'online',
    endpoints: {
      status: '/status',
      test: '/test',
      sendMessage: '/send-message'
    }
  });
});