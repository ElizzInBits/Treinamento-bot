const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Unidade = sequelize.define('Unidade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'empresa_id'
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    endereco: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cidade: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'unidades',
    timestamps: true,
    created_at: 'created_at',
    updated_at: 'updated_at'
  });

  return Unidade;
};
