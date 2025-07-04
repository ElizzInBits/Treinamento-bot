// models/Contato.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Contato = sequelize.define('contatos', {
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
    },

  statusTreinamento: { // Adicionado o campo de status de treinamento
    type: DataTypes.STRING,
    defaultValue: 'não iniciado', // O valor padrão é 'não iniciado'
  },
}, {
  timestamps: false,
  freezeTableName: true,
});

module.exports = Contato;
