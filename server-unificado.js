require('dotenv').config();
const express = require('express');
const cors = require('cors');
const wppconnect = require('@wppconnect-team/wppconnect');
const { connectDB, sequelize } = require('./SistemaPrincipal/BancoDeDados/database');
const { processarMensagem } = require('./SistemaPrincipal/TemplatesMensagens/Template2');

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 3000;
const WPP_PORT = 8080;

app.use(cors());
app.use(express.json());

// Cliente WhatsApp global
let wppClient = null;

console.log('🚀 Iniciando Servidor Unificado...');

// Conectar ao banco
(async () => {
  try {
    await connectDB();
    await sequelize.sync();
    console.log('✅ Banco conectado');
  } catch (error) {
    console.error('❌ Erro no banco:', error);
  }
})();

// Inicializar WhatsApp
async function inicializarWhatsApp() {
  try {
    console.log('🔄 Iniciando conexão WhatsApp...');
    
    wppClient = await wppconnect.create({
      session: 'NERDWHATS_AMERICA',
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
        console.log('\n📱 QR CODE:');
        console.log(asciiQR);
      },
      statusFind: (status) => {
        console.log('📶 Status WhatsApp:', status);
        if (status === 'inChat') {
          console.log('✅ WhatsApp CONECTADO e PRONTO!');
        }
      }
    });

    console.log('✅ Cliente WhatsApp criado!');
    
    // Verificar se está conectado
    const isConnected = await wppClient.isConnected();
    console.log(`🔍 Status de conexão: ${isConnected ? 'CONECTADO' : 'DESCONECTADO'}`);

    // Listener de mensagens
    wppClient.onMessage(async (message) => {
      if (!message.body && !message.selectedRowId) return;
      if (message.isGroupMsg) return;
      
      console.log('📨 Nova mensagem recebida!');
      
      setImmediate(async () => {
        try {
          await processarMensagem(message, wppClient);
        } catch (error) {
          console.error('❌ Erro ao processar:', error.message);
        }
      });
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar WhatsApp:', error);
  }
}

// API Routes do WhatsApp
app.get('/wpp/status', async (req, res) => {
  if (!wppClient) {
    return res.json({ 
      status: 'disconnected',
      session: 'NERDWHATS_AMERICA',
      client: 'null'
    });
  }
  
  try {
    const isConnected = await wppClient.isConnected();
    res.json({ 
      status: isConnected ? 'connected' : 'disconnected',
      session: 'NERDWHATS_AMERICA',
      client: 'active'
    });
  } catch (error) {
    res.json({ 
      status: 'error',
      session: 'NERDWHATS_AMERICA',
      error: error.message
    });
  }
});

app.post('/wpp/send-message', async (req, res) => {
  if (!wppClient) {
    return res.status(400).json({ error: 'WhatsApp não conectado' });
  }
  
  try {
    const { phone, message } = req.body;
    const result = await wppClient.sendText(`${phone}@c.us`, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Frontend Routes (do server-front.js)
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'admin-secret-key-2024';

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (username === (process.env.ADMIN_USERNAME || 'Administrador') && 
      password === (process.env.ADMIN_PASSWORD || 'maduroabacaxi')) {
    const token = jwt.sign({ 
      username: 'Administrador',
      loginTime: Date.now()
    }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Credenciais inválidas' });
  }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return res.redirect('/login-api');
    }
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/login-api');
      }
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Página de login para API
app.get('/login-api', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head><title>Login API</title></head>
<body>
    <h2>Login para acessar API</h2>
    <input type="text" id="user" placeholder="Usuário" value="Administrador">
    <input type="password" id="pass" placeholder="Senha">
    <button onclick="login()">Entrar</button>
    <div id="result"></div>
    <div id="api" style="display:none">
        <h3>Dados da API:</h3>
        <button onclick="getData('/api/treinamentos')">Treinamentos</button>
        <button onclick="getData('/api/contatos')">Contatos</button>
        <button onclick="getData('/api/empresas')">Empresas</button>
        <button onclick="logout()" style="background:red;color:white">Sair</button>
        <pre id="data"></pre>
    </div>
    <script>
        let token = localStorage.getItem('token');
        if(token) showAPI();
        
        async function login() {
            const user = document.getElementById('user').value;
            const pass = document.getElementById('pass').value;
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: user, password: pass})
            });
            const data = await res.json();
            if(data.token) {
                token = data.token;
                localStorage.setItem('token', token);
                showAPI();
            } else {
                document.getElementById('result').innerHTML = 'Erro: ' + data.message;
            }
        }
        
        function showAPI() {
            document.getElementById('api').style.display = 'block';
            document.getElementById('result').innerHTML = 'Logado com sucesso!';
            getData('/api/treinamentos');
        }
        
        async function getData(endpoint) {
            const res = await fetch(endpoint, {
                headers: {'Authorization': 'Bearer ' + token}
            });
            const data = await res.json();
            document.getElementById('data').innerHTML = JSON.stringify(data, null, 2);
        }
        
        function logout() {
            localStorage.removeItem('token');
            location.reload();
        }
        
        window.addEventListener('beforeunload', function() {
            localStorage.removeItem('token');
        });
    </script>
</body>
</html>
  `);
});

// Carregar rotas da API
try {
  const contatosRoutes = require('./SistemaPrincipal/front-end/routes/contatos.js');
  const treinamentosRoutes = require('./SistemaPrincipal/front-end/routes/treinamentos.js');
  const empresasRoutes = require('./SistemaPrincipal/front-end/routes/empresas.js');

  app.use('/api/contatos', (req, res, next) => {
    if (req.method === 'POST' && req.path === '/') {
      next();
    } else {
      authenticateToken(req, res, next);
    }
  }, contatosRoutes);

  app.use('/api/empresas', (req, res, next) => {
    if (req.path === '/select/options' || (req.method === 'POST' && req.path === '/')) {
      next();
    } else {
      authenticateToken(req, res, next);
    }
  }, empresasRoutes);

  app.use('/api/treinamentos', authenticateToken, treinamentosRoutes);

  console.log('✅ Rotas da API carregadas');
} catch (error) {
  console.error('❌ Erro ao carregar rotas:', error.message);
}

// Servir arquivos estáticos
const path = require('path');
const fs = require('fs');

const publicPath = path.join(__dirname, 'SistemaPrincipal', 'front-end', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Rotas básicas
app.get('/test', (req, res) => {
  res.json({
    message: 'Servidor Unificado funcionando!',
    whatsapp: wppClient ? 'conectado' : 'desconectado',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Servidor Unificado - Treinamento Bot',
    endpoints: {
      whatsapp: '/wpp/status',
      api: '/api/treinamentos',
      login: '/login-api'
    }
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Unificado rodando na porta ${PORT}`);
  console.log(`🔗 Frontend: http://72.60.48.249:${PORT}`);
  console.log(`🔗 WhatsApp API: http://72.60.48.249:${PORT}/wpp/status`);
  console.log(`🔗 Login API: http://72.60.48.249:${PORT}/login-api`);
  
  // Inicializar WhatsApp após servidor estar rodando
  inicializarWhatsApp();
});