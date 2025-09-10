// Script para otimizar índices do banco de dados
const { sequelize } = require('./database');

async function otimizarIndices() {
    try {
        console.log('🔧 Iniciando otimização de índices...');
        
        // Criar índice otimizado para telefone na tabela contatos
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_telefone 
            ON contatos (telefone)
        `);
        
        // Criar índice para status de treinamento
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_status 
            ON contatos (statusTreinamento)
        `);
        
        // Criar índice composto para telefone + status
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_telefone_status 
            ON contatos (telefone, statusTreinamento)
        `);
        
        // Criar índice para empresa_id
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_contatos_empresa 
            ON contatos (empresaId)
        `);
        
        // Criar índice para interações por telefone
        await sequelize.query(`
            CREATE INDEX IF NOT EXISTS idx_interacoes_telefone_data 
            ON interacoes (telefone, createdAt DESC)
        `);
        
        // Otimizar tabela contatos
        await sequelize.query('OPTIMIZE TABLE contatos');
        
        // Otimizar tabela interações
        await sequelize.query('OPTIMIZE TABLE interacoes');
        
        console.log('✅ Índices otimizados com sucesso!');
        
        // Mostrar estatísticas dos índices
        const [indices] = await sequelize.query(`
            SHOW INDEX FROM contatos WHERE Key_name LIKE 'idx_%'
        `);
        
        console.log('📊 Índices criados:');
        indices.forEach(idx => {
            console.log(`  - ${idx.Key_name}: ${idx.Column_name}`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao otimizar índices:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    otimizarIndices().then(() => {
        console.log('🏁 Otimização concluída!');
        process.exit(0);
    });
}

module.exports = { otimizarIndices };