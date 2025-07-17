const { DataTypes } = require('sequelize');
const { sequelize } = require('../database'); 
const Contato = require('./contato');
const Empresa = sequelize.define('empresas', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  razao_social: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cnpj: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  porte_empresa: {
    type: DataTypes.STRING,
    allowNull: true
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contato: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {                     
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  criado_em: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: false,
  freezeTableName: true
});

Empresa.hasMany(Contato, { foreignKey: 'empresaId' });
module.exports = Empresa;
