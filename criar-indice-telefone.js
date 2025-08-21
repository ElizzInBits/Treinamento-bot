const { connectDB, sequelize } = require('./SistemaPrincipal/BancoDeDados/database');

async function criarIndices() {
    try {
        await connectDB();
        
        console.log('🔧 Criando índices otimizados...');
        
        // Índice para telefone completo
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_telefone_completo 
            ON contatos(telefone);
        `);
        
        // Índice para últimos 8 dígitos do telefone
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_telefone_sufixo 
            ON contatos((RIGHT(telefone, 8)));
        `);
        
        console.log('✅ Índices criados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar índices:', error);
    } finally {
        await sequelize.close();
    }
}

criarIndices();