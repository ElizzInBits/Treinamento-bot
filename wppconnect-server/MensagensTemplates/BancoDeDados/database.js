// database.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { Sequelize } = require('sequelize');

// Configuração do banco usando variáveis de ambiente
const sequelize = new Sequelize(
  process.env.DB_NAME || 'listadecontatos',
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || 'admin!?',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /ER_LOCK_WAIT_TIMEOUT/,
        /ER_LOCK_DEADLOCK/
      ],
      max: 3
    }
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso.');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error.message);
    console.log('🔄 Tentando reconectar em 5 segundos...');
    
    setTimeout(async () => {
      await connectDB();
    }, 5000);
    
    return false;
  }
}

module.exports = { sequelize, connectDB };
