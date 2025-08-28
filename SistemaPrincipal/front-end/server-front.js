require('dotenv').config();
const cors = require('cors');
const path = require('path');
const express = require('express');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3000;

// WebSocket para atualizações em tempo real
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

// Exportar io para uso nas rotas
app.set('io', io);

// ✅ 1. Verificar se os arquivos de rota existem
console.log('🔍 Verificando arquivos de rota...');

const contatosPath = path.join(__dirname, 'routes', 'contatos.js');
const treinamentosPath = path.join(__dirname, 'routes', 'treinamentos.js');
const empresasPath = path.join(__dirname, 'routes', 'empresas.js');
const databasePath = path.join(__dirname, '..', 'BancoDeDados', 'database.js');

console.log('📁 Verificando arquivos de rota...');

if (!fs.existsSync(contatosPath)) console.error('❌ Arquivo routes/contatos.js não encontrado!');
if (!fs.existsSync(treinamentosPath)) console.error('❌ Arquivo routes/treinamentos.js não encontrado!');
if (!fs.existsSync(empresasPath)) console.error('❌ Arquivo routes/empresas.js não encontrado!');
if (!fs.existsSync(databasePath)) console.error('❌ Arquivo BancoDeDados/database.js não encontrado!');
else console.log('✅ Arquivos de rota verificados com sucesso');

// ✅ 2. Middlewares
console.log('🔧 Configurando middlewares...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors());

// ✅ 3. Middleware de debug
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ✅ 4. Servir arquivos estáticos da pasta public
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log('✅ Arquivos estáticos configurados em /public');
} else {
    console.error('❌ Pasta public não encontrada!');
}

// ✅ 5. Carregar rotas com tratamento de erro
let contatosRoutes, treinamentosRoutes, empresasRoutes;

// 📥 Contatos
try {
    console.log('📥 Carregando rota de contatos...');
    contatosRoutes = require('./routes/contatos.js');
    console.log('✅ Rota de contatos carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de contatos:', error.message);
    contatosRoutes = express.Router();
    contatosRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de contatos não pôde ser carregada', message: error.message });
    });
}

// 📥 Treinamentos
try {
    console.log('📥 Carregando rota de treinamentos...');
    treinamentosRoutes = require('./routes/treinamentos.js');
    console.log('✅ Rota de treinamentos carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de treinamentos:', error.message);
    treinamentosRoutes = express.Router();
    treinamentosRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de treinamentos não pôde ser carregada', message: error.message });
    });
}

// 📥 Empresas
try {
    console.log('📥 Carregando rota de empresas...');
    empresasRoutes = require('./routes/empresas.js');
    console.log('✅ Rota de empresas carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de empresas:', error.message);
    empresasRoutes = express.Router();
    empresasRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de empresas não pôde ser carregada', message: error.message });
    });
}

// 📊 Dashboard
let dashboardRoutes;
try {
    console.log('📊 Carregando rota de dashboard...');
    dashboardRoutes = require('./routes/dashboard.js');
    console.log('✅ Rota de dashboard carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de dashboard:', error.message);
    dashboardRoutes = express.Router();
    dashboardRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de dashboard não pôde ser carregada', message: error.message });
    });
}

// 👤 Usuário
let usuarioRoutes;
try {
    console.log('👤 Carregando rota de usuário...');
    usuarioRoutes = require('./routes/usuario.js');
    console.log('✅ Rota de usuário carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de usuário:', error.message);
    usuarioRoutes = express.Router();
    usuarioRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de usuário não pôde ser carregada', message: error.message });
    });
}

// ✅ 6. Sistema de autenticação
const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.JWT_SECRET || 'admin-secret-key-2024';
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora em ms

// Rota de login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    // Credenciais do admin via env
    if (username === (process.env.ADMIN_USERNAME || 'Administrador') && password === (process.env.ADMIN_PASSWORD || 'maduroabacaxi')) {
        const token = jwt.sign({ 
            username: 'Administrador',
            loginTime: Date.now()
        }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ success: true, token, inactivityTimeout: INACTIVITY_TIMEOUT });
    } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        // Se for requisição do navegador, redirecionar para login
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

// ✅ 7. Registrar rotas da API com autenticação
console.log('🔗 Registrando rotas da API...');
// Rotas públicas para cadastro
app.use('/api/contatos', (req, res, next) => {
    if (req.method === 'POST' && req.path === '/') {
        next(); // Permitir POST público para cadastro
    } else {
        authenticateToken(req, res, next);
    }
}, contatosRoutes);
app.use('/api/empresas', (req, res, next) => {
    if (req.path === '/select/options' || (req.method === 'POST' && req.path === '/')) {
        next(); // Permitir acesso público às opções de empresas e cadastro
    } else {
        authenticateToken(req, res, next);
    }
}, empresasRoutes);
app.use('/api/treinamentos', (req, res, next) => {
    // Interceptar requisições do navegador sem token
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token && req.headers.accept && req.headers.accept.includes('text/html')) {
        return res.redirect('/login-api?redirect=' + req.originalUrl);
    }
    
    authenticateToken(req, res, next);
}, treinamentosRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/usuario', usuarioRoutes);

// ✅ 7. Servir mídia (uploads) estáticos
const midiaPath = path.join(__dirname, '..', 'media', 'treinamentos');
if (fs.existsSync(midiaPath)) {
    app.use('/media/treinamentos', express.static(midiaPath));
    console.log('✅ Servindo arquivos de mídia em /media/treinamentos');
} else {
    console.warn('⚠️ Pasta de mídia media/treinamentos não encontrada!');
    // Tentar criar o diretório
    try {
        const fs = require('fs');
        fs.mkdirSync(midiaPath, { recursive: true });
        app.use('/media/treinamentos', express.static(midiaPath));
        console.log('✅ Diretório de mídia criado e configurado');
    } catch (e) {
        console.error('❌ Erro ao criar diretório de mídia:', e.message);
    }
}

// ✅ 8. Rota de teste básica
app.get('/test', (req, res) => {
    res.json({
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString(),
        routes: {
            contatos: '/api/contatos',
            treinamentos: '/api/treinamentos',
            empresas: '/api/empresas'
        }
    });
});

// Suprimir erro do Chrome DevTools
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(204).end();
});

// ✅ 9. Painéis HTML
const homePath = path.join(publicPath, 'home', 'home-index.html');
const autoCadastroPath = path.join(publicPath, 'autoCadastro', 'cadastro-index.html');
const emprePath = path.join(publicPath, 'empreCadastro', 'empre-index.html');

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

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
            getData();
        }
        
        async function getData(endpoint) {
            if (!endpoint) endpoint = window.location.search.replace('?redirect=', '') || '/api/treinamentos';
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

// Redirecionar para login
app.get('/', (req, res) => {
    const loginPath = path.join(publicPath, 'login', 'login.html');
    fs.existsSync(loginPath) ? res.sendFile(loginPath) : res.json({ error: 'Página de login não encontrada' });
});

app.get('/home', (req, res) => {
    fs.existsSync(homePath) ? res.sendFile(homePath) : res.json({ error: 'Painel 1 não encontrado', path: homePath });
});

app.get('/autoCadastro', (req, res) => {
    fs.existsSync(autoCadastroPath) ? res.sendFile(autoCadastroPath) : res.json({ error: 'Painel 2 não encontrado', path: autoCadastroPath });
});

app.get('/empre', (req, res) => {
    fs.existsSync(emprePath) ? res.sendFile(emprePath) : res.json({ error: 'Painel 3 não encontrado', path: emprePath });
});

app.get('/usuario-login', (req, res) => {
    const usuarioLoginPath = path.join(publicPath, 'usuario', 'login.html');
    fs.existsSync(usuarioLoginPath) ? res.sendFile(usuarioLoginPath) : res.json({ error: 'Página de login do usuário não encontrada' });
});

app.get('/usuario-painel', (req, res) => {
    const usuarioPainelPath = path.join(publicPath, 'usuario', 'painel.html');
    fs.existsSync(usuarioPainelPath) ? res.sendFile(usuarioPainelPath) : res.json({ error: 'Painel do usuário não encontrado' });
});

// ✅ 10. Middleware de erro
app.use((err, req, res, next) => {
    // Tratar erros de parsing JSON especificamente
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ Erro de parsing JSON:', err.message);
        console.error('📝 URL:', req.url);
        console.error('📝 Method:', req.method);
        console.error('📝 Content-Type:', req.get('Content-Type'));
        
        return res.status(400).json({ 
            error: 'Dados JSON inválidos',
            message: 'Verifique se os dados estão no formato JSON correto'
        });
    }
    
    console.error('❌ Erro capturado:', err.stack);
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ✅ 11. Rota 404
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'Rota não encontrada',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// ✅ 12. Inicializar servidor e conectar ao banco
async function iniciarServidor() {
    try {
        console.log('🚀 Iniciando servidor...');

        server.listen(PORT, '0.0.0.0', () => {
            const serverIP = process.env.FRONTEND_URL || 'http://72.60.48.249:3000';
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 Teste: ${serverIP}/test`);
            console.log(`📱 Painel 1: ${serverIP}/home`);
            console.log(`📱 Painel 2: ${serverIP}/autoCadastro`);
            console.log(`📱 Painel 3: ${serverIP}/empre`);
            console.log(`🔗 API Contatos: ${serverIP}/api/contatos`);
            console.log(`🔗 API Treinamentos: ${serverIP}/api/treinamentos`);
            console.log(`🔗 API Empresas: ${serverIP}/api/empresas`);
        });

        try {
            console.log('🔗 Tentando conectar ao banco de dados...');
            const { connectDB, sequelize } = require('../BancoDeDados/database.js');
            await connectDB();
            await sequelize.sync();
            console.log('✅ Banco de dados conectado e sincronizado!');
        } catch (dbError) {
            console.error('⚠️ Erro ao conectar ao banco de dados:', dbError.message);
        }

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

iniciarServidor();
