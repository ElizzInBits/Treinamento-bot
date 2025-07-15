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
const databasePath = path.join(__dirname, '..', 'BancoDeDados', 'database.js');

console.log('📁 Caminhos dos arquivos:');
console.log('  - Contatos:', contatosPath);
console.log('  - Treinamentos:', treinamentosPath);
console.log('  - Database:', databasePath);

// Verificar existência dos arquivos
if (!fs.existsSync(contatosPath)) {
    console.error('❌ Arquivo routes/contatos.js não encontrado!');
}
if (!fs.existsSync(treinamentosPath)) {
    console.error('❌ Arquivo routes/treinamentos.js não encontrado!');
}
if (!fs.existsSync(databasePath)) {
    console.error('❌ Arquivo BancoDeDados/database.js não encontrado!');
}

// ✅ 2. Middlewares básicos
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
console.log('📁 Pasta pública:', publicPath);
if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
    console.log('✅ Arquivos estáticos configurados');
} else {
    console.error('❌ Pasta public não encontrada!');
}

// ✅ 5. Tentar carregar as rotas com tratamento de erro
let contatosRoutes, treinamentosRoutes;

try {
    console.log('📥 Carregando rota de contatos...');
    contatosRoutes = require('./routes/contatos.js');
    console.log('✅ Rota de contatos carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de contatos:', error.message);
    // Criar rota temporária
    contatosRoutes = express.Router();
    contatosRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de contatos não pôde ser carregada', message: error.message });
    });
}

try {
    console.log('📥 Carregando rota de treinamentos...');
    treinamentosRoutes = require('./routes/treinamentos.js');
    console.log('✅ Rota de treinamentos carregada com sucesso');
} catch (error) {
    console.error('❌ Erro ao carregar rota de treinamentos:', error.message);
    // Criar rota temporária
    treinamentosRoutes = express.Router();
    treinamentosRoutes.get('/', (req, res) => {
        res.json({ error: 'Rota de treinamentos não pôde ser carregada', message: error.message });
    });
}

// ✅ 6. Registrar rotas da API
console.log('🔗 Registrando rotas da API...');
app.use('/api/contatos', contatosRoutes);
app.use('/api/treinamentos', treinamentosRoutes);
console.log('✅ Rotas da API registradas');

// ✅ 7. Rota de teste básica
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString(),
        routes: {
            contatos: '/api/contatos',
            treinamentos: '/api/treinamentos'
        }
    });
});

// ✅ 8. Rotas para painéis
const painel1Path = path.join(__dirname, 'public', 'painel1', 'home-index.html');
const painel2Path = path.join(__dirname, 'public', 'painel2', 'cadastro-index.html');

app.get('/', (req, res) => {
    if (fs.existsSync(painel1Path)) {
        res.sendFile(painel1Path);
    } else {
        res.json({ error: 'Painel 1 não encontrado', path: painel1Path });
    }
});

app.get('/painel1', (req, res) => {
    if (fs.existsSync(painel1Path)) {
        res.sendFile(painel1Path);
    } else {
        res.json({ error: 'Painel 1 não encontrado', path: painel1Path });
    }
});

app.get('/painel2', (req, res) => {
    if (fs.existsSync(painel2Path)) {
        res.sendFile(painel2Path);
    } else {
        res.json({ error: 'Painel 2 não encontrado', path: painel2Path });
    }
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

// ✅ 11. Inicializar servidor sem banco primeiro
async function iniciarServidor() {
    try {
        console.log('🚀 Iniciando servidor sem banco de dados...');
        
        const server = app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`🔗 Teste: http://92.112.178.26:${PORT}/test`);
            console.log(`📱 Painel 1: http://92.112.178.26:${PORT}/painel1`);
            console.log(`📱 Painel 2: http://92.112.178.26:${PORT}/painel2`);
            console.log(`🔗 API Contatos: http://92.112.178.26:${PORT}/api/contatos`);
            console.log(`🔗 API Treinamentos: http://92.112.178.26:${PORT}/api/treinamentos`);
        });

        // Tentar conectar ao banco depois
        try {
            console.log('🔗 Tentando conectar ao banco de dados...');
            const { connectDB, sequelize } = require('../BancoDeDados/database.js');
            await connectDB();
            await sequelize.sync();
            console.log('✅ Banco de dados conectado e sincronizado!');
        } catch (dbError) {
            console.error('⚠️ Erro no banco de dados (servidor continuará sem DB):', dbError.message);
        }

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

iniciarServidor();