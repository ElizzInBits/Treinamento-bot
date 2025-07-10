// database.js
const { Sequelize } = require('sequelize');

// Altere os dados abaixo para o seu banco:
const sequelize = new Sequelize('listadecontatos', 'root', 'admin!?', {
  host: 'localhost', // ou IP do servidor MySQL
  dialect: 'mysql',
  logging: false, // opcional: desativa logs no console
});

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com MySQL estabelecida com sucesso.');
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error.message);
  }
}

module.exports = { sequelize, connectDB };
