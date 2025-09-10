const { sequelize } = require('./database');

async function adicionarCampoNomeEmpresa() {
    try {
        console.log('🔄 Adicionando campo nomeEmpresa à tabela contatos...');
        
        await sequelize.query(`
            ALTER TABLE contatos 
            ADD COLUMN IF NOT EXISTS nomeEmpresa VARCHAR(255)
        `);
        
        console.log('✅ Campo nomeEmpresa adicionado com sucesso!');
        
        // Atualizar empresaId para 1 onde for null
        await sequelize.query(`
            UPDATE contatos 
            SET empresaId = 1 
            WHERE empresaId IS NULL
        `);
        
        console.log('✅ EmpresaId atualizado para empresa padrão (ID: 1)');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar campo:', error);
    } finally {
        await sequelize.close();
    }
}

adicionarCampoNomeEmpresa();