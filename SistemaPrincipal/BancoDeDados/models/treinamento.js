const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

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
  modalidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cargaHoraria: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  emConformidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  aproveitamento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  instrutor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qualificacaoInstrutor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  registroInstrutor: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'registro_instrutor'
  },
  responsavel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cargoResponsavel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  areaResponsavel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registroResponsavel: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'registro_responsavel'
  },

  midias: {
    type: DataTypes.TEXT, 
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
};

module.exports = Treinamento;
