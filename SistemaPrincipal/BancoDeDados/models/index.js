const Sequelize = require('sequelize');
const { sequelize } = require('../database'); 

// Importação dos modelos
const EmpresaModel = require('./empresas');
const UsuarioModel = require('./usuario');
// ContatoModel removido - usar Usuario
const EmpresaTreinamentoModel = require('./empresaTreinamento');
const TreinamentoModel = require('./treinamento');
const EmpresaSenhaModel = require('./empresaSenha');
const SessaoTreinamentoModel = require('./sessaoTreinamento');
const InteracaoModel = require('./interacao');
const AssinaturaCertificadoModel = require('./AssinaturaCertificado');

// Inicializa os modelos
const Empresa = EmpresaModel(sequelize, Sequelize.DataTypes);
const Usuario = UsuarioModel(sequelize, Sequelize.DataTypes);
// Contato removido - usar Usuario
const EmpresaTreinamento = EmpresaTreinamentoModel(sequelize, Sequelize.DataTypes);
const Treinamento = TreinamentoModel(sequelize, Sequelize.DataTypes);
const EmpresaSenha = EmpresaSenhaModel(sequelize, Sequelize.DataTypes);
const SessaoTreinamento = SessaoTreinamentoModel(sequelize, Sequelize.DataTypes);
const Interacao = InteracaoModel(sequelize, Sequelize.DataTypes);
const AssinaturaCertificado = AssinaturaCertificadoModel(sequelize, Sequelize.DataTypes);

// Cria o objeto com todos os modelos
const models = {
  Empresa,
  Usuario,
  EmpresaTreinamento,
  Treinamento,
  EmpresaSenha,
  SessaoTreinamento,
  Interacao,
  AssinaturaCertificado,
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
