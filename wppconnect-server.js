const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

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
  console.log(`🚀 WppConnect Server rodando na porta ${PORT}`);
  console.log(`🔗 Status: http://72.60.48.249:${PORT}/status`);
});