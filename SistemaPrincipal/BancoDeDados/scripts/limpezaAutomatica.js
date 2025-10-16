const { sequelize } = require('../database');

async function limparSessoesAntigas() {
  try {
    console.log('🧹 Iniciando limpeza de sessões antigas...');
    
    // Remover sessões inativas há mais de 7 dias
    const [result] = await sequelize.query(`
      UPDATE sessoes_treinamentos 
      SET ativo = false 
      WHERE ativo = true 
      AND ultimaAtualizacao < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    
    console.log(`✅ ${result.affectedRows} sessões antigas marcadas como inativas`);
    
    // Deletar sessões inativas há mais de 30 dias
    const [deleteResult] = await sequelize.query(`
      DELETE FROM sessoes_treinamentos 
      WHERE ativo = false 
      AND ultimaAtualizacao < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    console.log(`🗑️ ${deleteResult.affectedRows} sessões antigas removidas`);
    
  } catch (error) {
    console.error('❌ Erro na limpeza automática:', error);
  }
}

// Executar limpeza a cada 24 horas
setInterval(limparSessoesAntigas, 24 * 60 * 60 * 1000);

// Executar uma vez ao iniciar
limparSessoesAntigas();

module.exports = { limparSessoesAntigas };