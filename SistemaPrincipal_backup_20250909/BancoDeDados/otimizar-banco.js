const { connectDB, sequelize } = require('./database');

async function otimizarBanco() {
    try {
        await connectDB();
        
        console.log('🔧 Otimizando banco de dados...');
        
        // Criar índices manualmente se não existirem
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone);
        `);
        
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_empresa ON contatos(empresaId);
        `);
        
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(statusTreinamento);
        `);
        
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_interacoes_telefone ON interacoes(telefone);
        `);
        
        console.log('✅ Banco otimizado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao otimizar banco:', error);
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    otimizarBanco();
}

module.exports = { otimizarBanco };