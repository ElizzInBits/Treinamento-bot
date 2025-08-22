// database.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'listadecontatos',
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || 'Admin!?',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      connectTimeout: 60000
    },
    pool: {
      max: 5,
      min: 1,
      acquire: 10000,
      idle: 5000
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
