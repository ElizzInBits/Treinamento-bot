const cors = require('cors');
const path = require('path');
const express = require('express');
const { connectDB, sequelize } = require('../BancoDeDados/database.js');

const contatosRoutes = require('./routes/contatos.js');
const treinamentosRoutes = require('./routes/treinamentos.js');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Primeiro os middlewares
app.use(express.json());
app.use(cors());

// ✅ Depois as rotas
app.use('/api/contatos', contatosRoutes);
app.use('/api/treinamentos', treinamentosRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Rota 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

app.get('/autocadastro', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'autocadastro.html'));
});


// Inicializar servidor
async function iniciarServidor() {
    try {
        console.log('🔗 Conectando ao banco de dados...');
        await connectDB();
        await sequelize.sync();
        console.log('✅ Banco de dados conectado e sincronizado!');

        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📱 Acesse: http://92.112.178.26:${PORT}`);
            console.log(`🔗 API: http://92.112.178.26:${PORT}/api/contatos`);
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

iniciarServidor();