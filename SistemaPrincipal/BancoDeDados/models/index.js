const sequelize = require('../database'); // sua conexão Sequelize

// Importação dos modelos
const EmpresaModel = require('./empresas');
const ContatoModel = require('./contato'); // atenção: arquivo é contato.js, singular

// Inicializa os modelos com a instância do Sequelize
const Empresa = EmpresaModel(sequelize);
const Contato = ContatoModel(sequelize);

// Faz as associações se existirem
if (Empresa.associate) Empresa.associate({ Contato });
if (Contato.associate) Contato.associate({ Empresa });

// Exporta os modelos prontos
module.exports = {
  sequelize,
  Empresa,
  Contato,
};
