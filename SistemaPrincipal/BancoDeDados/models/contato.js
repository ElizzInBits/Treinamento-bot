const { DataTypes } = require('sequelize');
const sequelize = require('../database');

module.exports = (sequelize) => {
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
      validate: {
        isEmail: true,
      },
    },
    cpf: {
      type: DataTypes.CHAR(11),
      allowNull: true,
      unique: true,
    },

    statusTreinamento: {
      type: DataTypes.STRING,
      defaultValue: 'não iniciado',
    },
    treinamentoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'empresas',
        key: 'id',
      },
    },

    ultimaInteracao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: false,
    freezeTableName: true,
  });

Contato.associate = (models) => {
  Contato.belongsTo(models.Empresa, {
    foreignKey: 'empresaId',
    as: 'empresaRef' 
  });
};


  return Contato;
};
