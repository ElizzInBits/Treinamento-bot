// Script para verificar índices existentes
const { sequelize } = require('./database');

async function verificarIndices() {
    try {
        console.log('🔍 Verificando índices existentes...');
        
        // Verificar índices da tabela contatos
        const [indices] = await sequelize.query(`
            SHOW INDEX FROM contatos
        `);
        
        console.log('📊 Índices na tabela contatos:');
        indices.forEach(idx => {
            console.log(`  - ${idx.Key_name}: ${idx.Column_name} (${idx.Index_type})`);
        });
        
        // Verificar se índice de telefone existe
        const telefoneIndex = indices.find(idx => idx.Column_name === 'telefone');
        if (!telefoneIndex) {
            console.log('⚠️  ATENÇÃO: Índice para telefone não encontrado!');
            console.log('💡 Recomendação: CREATE INDEX idx_telefone ON contatos (telefone);');
        } else {
            console.log('✅ Índice para telefone encontrado');
        }
        
        // Verificar estatísticas da tabela
        const [stats] = await sequelize.query(`
            SELECT 
                COUNT(*) as total_contatos,
                COUNT(DISTINCT telefone) as telefones_unicos,
                COUNT(CASE WHEN statusTreinamento = 'em andamento' THEN 1 END) as em_andamento,
                COUNT(CASE WHEN statusTreinamento = 'não iniciado' THEN 1 END) as nao_iniciado
            FROM contatos
        `);
        
        console.log('📈 Estatísticas da tabela:');
        console.log(`  - Total de contatos: ${stats[0].total_contatos}`);
        console.log(`  - Telefones únicos: ${stats[0].telefones_unicos}`);
        console.log(`  - Em andamento: ${stats[0].em_andamento}`);
        console.log(`  - Não iniciado: ${stats[0].nao_iniciado}`);
        
    } catch (error) {
        console.error('❌ Erro ao verificar índices:', error.message);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    verificarIndices().then(() => {
        console.log('🏁 Verificação concluída!');
        process.exit(0);
    });
}

module.exports = { verificarIndices };