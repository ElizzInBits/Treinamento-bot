const Sequelize = require('sequelize');
const sequelize = require('../database'); // seu arquivo que instancia o sequelize

const Empresa = require('./empresas')(sequelize, Sequelize.DataTypes);
const Contato = require('./contato')(sequelize, Sequelize.DataTypes);

// Se precisar associar os modelos:
Empresa.associate({ Contato });
Contato.associate({ Empresa });

module.exports = {
  sequelize,
  Empresa,
  Contato,
};
