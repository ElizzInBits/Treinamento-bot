const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmpresaTreinamento = sequelize.define('empresas_treinamentos', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'empresas',
        key: 'id',
      },
    },
    treinamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'treinamentos',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: false,
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['empresa_id', 'treinamento_id']
      }
    ]
  });

  return EmpresaTreinamento;
};