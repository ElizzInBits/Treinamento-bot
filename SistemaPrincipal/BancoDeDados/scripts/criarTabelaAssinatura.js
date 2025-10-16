const { sequelize } = require('../database');

async function criarTabelaAssinatura() {
  try {
    console.log('🔧 Criando tabela assinaturas_certificados...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS assinaturas_certificados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        certificado_path VARCHAR(500) NOT NULL,
        assinatura_base64 TEXT,
        token_assinatura VARCHAR(255) NOT NULL UNIQUE,
        assinado_em DATETIME,
        expires_at DATETIME NOT NULL,
        status ENUM('pendente', 'assinado', 'expirado') DEFAULT 'pendente',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_token (token_assinatura),
        INDEX idx_usuario (usuario_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ Tabela assinaturas_certificados criada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  criarTabelaAssinatura();
}

module.exports = criarTabelaAssinatura;