const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmpresaSenha = sequelize.define('empresas_senhas', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'empresa_id',
      references: {
        model: 'empresas',
        key: 'id'
      }
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    criadoEm: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    atualizadoEm: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });

  EmpresaSenha.associate = (models) => {
    EmpresaSenha.belongsTo(models.Empresa, { 
      foreignKey: 'empresa_id', 
      as: 'empresa' 
    });
  };

  return EmpresaSenha;
};