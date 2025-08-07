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
app.use(express.json());
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

// ✅ 6. Registrar rotas da API
console.log('🔗 Registrando rotas da API...');
app.use('/api/contatos', contatosRoutes);
app.use('/api/treinamentos', treinamentosRoutes);
app.use('/api/empresas', empresasRoutes);
app.use('/api/dashboard', dashboardRoutes);

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

app.get('/', (req, res) => {
    fs.existsSync(homePath) ? res.sendFile(homePath) : res.json({ error: 'Painel 1 não encontrado', path: homePath });
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

// ✅ 10. Middleware de erro
app.use((err, req, res, next) => {
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

        server.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 Teste: http://localhost:${PORT}/test`);
            console.log(`📱 Painel 1: http://localhost:${PORT}/home`);
            console.log(`📱 Painel 2: http://localhost:${PORT}/autoCadastro`);
            console.log(`📱 Painel 3: http://localhost:${PORT}/empre`);
            console.log(`🔗 API Contatos: http://localhost:${PORT}/api/contatos`);
            console.log(`🔗 API Treinamentos: http://localhost:${PORT}/api/treinamentos`);
            console.log(`🔗 API Empresas: http://localhost:${PORT}/api/empresas`);
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
