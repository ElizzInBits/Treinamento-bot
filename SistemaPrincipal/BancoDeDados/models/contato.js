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

  treinamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: false,
  freezeTableName: true,
});


Contato.associate = (models) => {
    Contato.belongsToMany(models.Treinamento, {
        through: 'ContatoTreinamentos',
        foreignKey: 'contatoId',
        otherKey: 'treinamentoId'
    });
};

module.exports = Contato;
