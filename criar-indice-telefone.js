const { connectDB, sequelize } = require('./SistemaPrincipal/BancoDeDados/database');

async function criarIndices() {
    try {
        await connectDB();
        
        console.log('🔧 Criando índices otimizados...');
        
        // Verificar e criar índice para telefone completo
        try {
            await sequelize.query(`CREATE INDEX idx_contatos_telefone_completo ON contatos(telefone)`);
            console.log('✅ Índice telefone completo criado');
        } catch (error) {
            if (error.original?.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Índice telefone completo já existe');
            } else {
                console.log('⚠️ Erro ao criar índice telefone:', error.message);
            }
        }
        
        // Verificar e criar índice para empresa
        try {
            await sequelize.query(`CREATE INDEX idx_contatos_empresa ON contatos(empresaId)`);
            console.log('✅ Índice empresa criado');
        } catch (error) {
            if (error.original?.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Índice empresa já existe');
            } else {
                console.log('⚠️ Erro ao criar índice empresa:', error.message);
            }
        }
        
        console.log('✅ Índices criados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao criar índices:', error);
    } finally {
        await sequelize.close();
    }
}

criarIndices();