const cors = require('cors');
const path = require('path');
const express = require('express');
const { connectDB, sequelize } = require('../BancoDeDados/database.js');

const contatosRoutes = require('./routes/contatos.js');
const treinamentosRoutes = require('./routes/treinamentos.js');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middlewares na ordem correta
app.use(express.json());
app.use(cors());

// ✅ Servir arquivos estáticos ANTES das rotas específicas
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Rotas da API
app.use('/api/contatos', contatosRoutes);
app.use('/api/treinamentos', treinamentosRoutes);

// ✅ Rotas específicas para diferentes painéis
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'painel1', 'index.html'));
});

app.get('/painel1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'painel1', 'index.html'));
});

app.get('/painel2', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'painel2', 'index.html'));
});

// ✅ Middleware de erro
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// ✅ Rota 404 (deve ser a última)
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Rota não encontrada' });
});

// ✅ Inicializar servidor
async function iniciarServidor() {
    try {
        console.log('🔗 Conectando ao banco de dados...');
        await connectDB();
        await sequelize.sync();
        console.log('✅ Banco de dados conectado e sincronizado!');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📱 Painel 1: http://92.112.178.26:${PORT}/painel1`);
            console.log(`📱 Painel 2: http://92.112.178.26:${PORT}/painel2`);
            console.log(`🔗 API Contatos: http://92.112.178.26:${PORT}/api/contatos`);
            console.log(`🔗 API Treinamentos: http://92.112.178.26:${PORT}/api/treinamentos`);
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

iniciarServidor();