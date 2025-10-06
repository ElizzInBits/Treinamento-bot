const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmpresaSenha = sequelize.define('empresa_senhas', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'empresa_id',
      references: {
        model: 'empresas',
        key: 'id'
      }
    },
    nomeEmpresa: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'nome_empresa',
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    criadoEm: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'criado_em',
    },
    atualizadoEm: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'atualizado_em',
    }
  }, {
    timestamps: false,
    freezeTableName: true,
  });

  EmpresaSenha.associate = (models) => {
    EmpresaSenha.belongsTo(models.Empresa, { 
      foreignKey: 'empresaId', 
      as: 'empresa' 
    });
  };

  return EmpresaSenha;
};