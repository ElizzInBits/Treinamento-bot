const cors = require('cors');
const path = require('path');
const express = require('express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ 1. Verificar se os arquivos de rota existem
console.log('🔍 Verificando arquivos de rota...');

const contatosPath = path.join(__dirname, 'routes', 'contatos.js');
const treinamentosPath = path.join(__dirname, 'routes', 'treinamentos.js');
const empresasPath = path.join(__dirname, 'routes', 'empresas.js');
const databasePath = path.join(__dirname, '..', 'BancoDeDados', 'database.js');

console.log('📁 Caminhos dos arquivos:');
console.log('  - Contatos:', contatosPath);
console.log('  - Treinamentos:', treinamentosPath);
console.log('  - Empresas:', empresasPath);
console.log('  - Database:', databasePath);

if (!fs.existsSync(contatosPath)) console.error('❌ Arquivo routes/contatos.js não encontrado!');
if (!fs.existsSync(treinamentosPath)) console.error('❌ Arquivo routes/treinamentos.js não encontrado!');
if (!fs.existsSync(empresasPath)) console.error('❌ Arquivo routes/empresas.js não encontrado!');
if (!fs.existsSync(databasePath)) console.error('❌ Arquivo BancoDeDados/database.js não encontrado!');

// ✅ 2. Middlewares
console.log('🔧 Configurando middlewares...');
app.use(express.json());
app.use(cors());

// ✅ 3. Middleware de debug
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ✅ 4. Servir arquivos estáticos
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log('✅ Arquivos estáticos configurados');
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

// ✅ 6. Registrar rotas da API
console.log('🔗 Registrando rotas da API...');
app.use('/api/contatos', contatosRoutes);
app.use('/api/treinamentos', treinamentosRoutes);
app.use('/api/empresas', empresasRoutes);
console.log('✅ Rotas da API registradas');

// ✅ 7. Rota de teste básica
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

// ✅ 8. Painéis HTML
const homePath = path.join(__dirname, 'public', 'home', 'home-index.html');
const autoCadastroPath = path.join(__dirname, 'public', 'autoCadastro', 'cadastro-index.html');
const emprePath = path.join(__dirname, 'public', 'empreCadastro', 'empre-index.html');

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

// ✅ 9. Middleware de erro
app.use((err, req, res, next) => {
    console.error('❌ Erro capturado:', err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// ✅ 10. Rota 404
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Rota não encontrada',
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// ✅ 11. Inicializar servidor e conectar ao banco
async function iniciarServidor() {
    try {
        console.log('🚀 Iniciando servidor...');
        
        const server = app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 Teste: http://92.112.178.26:${PORT}/test`);
            console.log(`📱 Painel 1: http://92.112.178.26:${PORT}/home`);
            console.log(`📱 Painel 2: http://92.112.178.26:${PORT}/autoCadastro`);
            console.log(`📱 Painel 3: http://92.112.178.26:${PORT}/empre`);
            console.log(`🔗 API Contatos: http://92.112.178.26:${PORT}/api/contatos`);
            console.log(`🔗 API Treinamentos: http://92.112.178.26:${PORT}/api/treinamentos`);
            console.log(`🔗 API Empresas: http://92.112.178.26:${PORT}/api/empresas`);
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
