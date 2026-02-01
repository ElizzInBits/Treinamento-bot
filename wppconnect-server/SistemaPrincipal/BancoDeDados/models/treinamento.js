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
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'treinamento',
  timestamps: true,  // createdAt e updatedAt
  underscored: true, // para usar snake_case nos campos (opcional)
});


Treinamento.associate = (models) => {
    Treinamento.belongsToMany(models.Contato, {
        through: 'ContatoTreinamentos',
        foreignKey: 'treinamentoId',
        otherKey: 'contatoId'
    });
};


module.exports = Treinamento;