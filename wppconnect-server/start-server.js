const wppconnect = require('@wppconnect-team/wppconnect');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let client = null;

async function startServer() {
  try {
    console.log('🚀 Iniciando WppConnect Server...');
    
    client = await wppconnect.create({
      session: 'NERDWHATS_AMERICA',
      headless: true,
      devtools: false,
      useChrome: true,
      debug: false,
      logQR: true,
      disableSpins: true,
      disableWelcome: true,
      updatesLog: true,
      autoClose: 60000,
      createPathFileToken: true,
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
      ],
      catchQR: (base64Qr, asciiQR) => {
        console.log('📱 QR Code gerado:');
        console.log(asciiQR);
      },
      statusFind: (statusSession, session) => {
        console.log(`📊 Status da sessão ${session}: ${statusSession}`);
      }
    });

    console.log('✅ Cliente WhatsApp conectado com sucesso!');

    // Configurar eventos
    client.onMessage(async (message) => {
      console.log('📨 Nova mensagem recebida:', message.body);
    });

    client.onStateChange((state) => {
      console.log('🔄 Estado alterado:', state);
    });

    // API Routes
    app.get('/api/:session/status', async (req, res) => {
      try {
        const isConnected = await client.isConnected();
        res.json({ connected: isConnected });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post('/api/:session/send-message', async (req, res) => {
      try {
        const { phone, message } = req.body;
        const result = await client.sendText(phone, message);
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.listen(21465, '0.0.0.0', () => {
      console.log('🌐 Servidor rodando na porta 21465');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    setTimeout(() => {
      console.log('🔄 Tentando reiniciar...');
      startServer();
    }, 5000);
  }
}

// Tratamento de sinais
process.on('SIGINT', async () => {
  console.log('🛑 Encerrando servidor...');
  if (client) {
    await client.close();
  }
  process.exit(0);
});

startServer();