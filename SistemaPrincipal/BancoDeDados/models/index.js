

const sequelize = require('../database'); // <-- sua conexão com Sequelize
const EmpresaModel = require('./empresas');
const ContatoModel = require('./contatos');

const Empresa = EmpresaModel(sequelize);
const Contato = ContatoModel(sequelize);

// Definir associações (se existirem)
if (Empresa.associate) Empresa.associate({ Contato });
if (Contato.associate) Contato.associate({ Empresa });

module.exports = {
  sequelize,
  Empresa,
  Contato,
};
