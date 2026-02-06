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
const FluxoModel = require('./fluxo');
const UnidadeModel = require('./unidade');
const SetorModel = require('./setor');
const CargoModel = require('./cargo');
const QuizScoreModel = require('./quizScore');
const QuizRankingModel = require('./quizRanking');

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
const Fluxo = FluxoModel(sequelize, Sequelize.DataTypes);
const Unidade = UnidadeModel(sequelize, Sequelize.DataTypes);
const Setor = SetorModel(sequelize, Sequelize.DataTypes);
const Cargo = CargoModel(sequelize, Sequelize.DataTypes);
const QuizScore = QuizScoreModel(sequelize, Sequelize.DataTypes);
const QuizRanking = QuizRankingModel(sequelize, Sequelize.DataTypes);

// Relacionamentos
Empresa.hasMany(Unidade, { foreignKey: 'empresa_id', as: 'unidades' });
Unidade.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Unidade.hasMany(Setor, { foreignKey: 'unidadeId', as: 'setores' });
Setor.belongsTo(Unidade, { foreignKey: 'unidadeId', as: 'unidade' });

Setor.hasMany(Cargo, { foreignKey: 'setorId', as: 'cargos' });
Cargo.belongsTo(Setor, { foreignKey: 'setorId', as: 'setor' });

// Usar 'as' diferente para evitar conflito com coluna 'cargo' existente
Usuario.belongsTo(Unidade, { foreignKey: 'unidade_id', as: 'unidadeVinculada' });
Usuario.belongsTo(Setor, { foreignKey: 'setor_id', as: 'setorVinculado' });
Usuario.belongsTo(Cargo, { foreignKey: 'cargo_id', as: 'cargoVinculado' });

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
  Fluxo,
  Unidade,
  Setor,
  Cargo,
  QuizScore,
  QuizRanking,
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
