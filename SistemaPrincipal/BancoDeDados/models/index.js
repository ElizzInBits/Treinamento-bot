const Sequelize = require('sequelize');
const { sequelize } = require('../database'); 

// Importação dos modelos
const EmpresaModel = require('./empresas');
const ContatoModel = require('./contato');
const InteracaoModel = require('./interacao'); 

// Inicializa os modelos
const Empresa = EmpresaModel(sequelize, Sequelize.DataTypes);
const Contato = ContatoModel(sequelize, Sequelize.DataTypes);
const Interacao = InteracaoModel(sequelize, Sequelize.DataTypes);

// Cria o objeto com todos os modelos
const models = {
  Empresa,
  Contato,
  Interacao,
};

// Faz as associações
Object.values(models).forEach(model => {
  if (typeof model.associate === 'function') {
    model.associate(models);
  }
});

// Exporta tudo
module.exports = {
  sequelize,
  ...models,
};
