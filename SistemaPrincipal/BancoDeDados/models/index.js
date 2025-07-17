// 📁 BancoDeDados/models/index.js
const sequelize = require('../database'); // sua conexão com Sequelize
const EmpresaModel = require('./empresas');
const ContatoModel = require('./contatos');

// Inicializa os modelos passando a instância do Sequelize
const Empresa = EmpresaModel(sequelize);
const Contato = ContatoModel(sequelize);

// Associações (se houverem)
if (Empresa.associate) Empresa.associate({ Contato });
if (Contato.associate) Contato.associate({ Empresa });

// Exporta tudo pronto para uso
module.exports = {
  sequelize,
  Empresa,
  Contato,
};
