const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

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
}).catch(err => {
  console.error('❌ Erro WppConnect:', err);
});

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