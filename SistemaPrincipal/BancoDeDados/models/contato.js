const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Empresa = require('./Empresa'); 

const Contato = sequelize.define('contatos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nomeCompleto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  cpf: {
    type: DataTypes.CHAR(11),
    allowNull: true,
    unique: true,
  },
  empresaId: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'empresas',
    }
  },
  statusTreinamento: {
    type: DataTypes.STRING,
    defaultValue: 'não iniciado',
  },
  treinamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

// Relações
Contato.associate = (models) => {
  Contato.belongsTo(models.Empresa, {
    foreignKey: 'empresaId',
    as: 'empresa'
  });
};

module.exports = Contato;
