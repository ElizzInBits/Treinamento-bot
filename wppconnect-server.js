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
  session: 'NERDWHATS_AMERICA',
  headless: true,
  disableWelcome: true,
  updatesLog: false,
  puppeteerOptions: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
}).then(c => {
  client = c;
  console.log('✅ WppConnect Server conectado!');
}).catch(err => {
  console.error('❌ Erro:', err);
});

// Rotas da API
app.get('/status', (req, res) => {
  res.json({ 
    status: client ? 'connected' : 'disconnected',
    session: 'NERDWHATS_AMERICA'
  });
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

app.listen(PORT, () => {
  console.log(`🚀 WppConnect Server rodando na porta ${PORT}`);
});