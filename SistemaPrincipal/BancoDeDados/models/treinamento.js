const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Treinamento = sequelize.define('Treinamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  modalidade: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  carga_horaria: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  em_conformidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  aproveitamento_conteudo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  conteudo_programatico: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  midias_treinamento: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  instrutor_principal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  qualificacao_instrutor: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  registro_instrutor: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  responsavel_treinamento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cargo_responsavel: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  area_responsavel: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  registro_responsavel: {
    type: DataTypes.STRING(100),
    allowNull: true,
  }
  }, {
    tableName: 'treinamento',
    timestamps: true,
    underscored: true,
  });

  Treinamento.associate = (models) => {
    Treinamento.belongsToMany(models.Contato, {
      through: 'ContatoTreinamentos',
      foreignKey: 'treinamentoId',
      otherKey: 'contatoId'
    });
    Treinamento.belongsToMany(models.Empresa, {
      through: models.EmpresaTreinamento,
      foreignKey: 'treinamento_id',
      otherKey: 'empresa_id',
      as: 'empresas'
    });
  };

  return Treinamento;
};