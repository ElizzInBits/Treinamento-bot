// database.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'listadecontatos',
  process.env.DB_USER || 'bot_user', 
  process.env.DB_PASS || 'SenhaForte123!',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000,
      charset: 'utf8mb4'
    },
    pool: {
      max: 25,
      min: 5,
      acquire: 30000,
      idle: 10000,
      evict: 1000
    },
    benchmark: true,
    retry: {
      match: [/ETIMEDOUT/, /EHOSTUNREACH/, /ECONNRESET/, /ECONNREFUSED/],
      max: 3
    }
  }
);

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error.message);
  }
}

module.exports = { sequelize, connectDB, Sequelize };
