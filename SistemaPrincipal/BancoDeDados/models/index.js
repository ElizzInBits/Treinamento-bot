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

// Faz as associações, se houver
if (Empresa.associate) Empresa.associate({ Contato });
if (Contato.associate) Contato.associate({ Empresa });

// Exporta tudo
module.exports = {
  sequelize,
  Empresa,
  Contato,
  Interacao, 
};
