const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Empresa = sequelize.define('empresas', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    razaoSocial: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'razao_social',
    },
    cnpj: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    porteEmpresa: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'porte_empresa',
    },
    endereco: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cep: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    contato: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    criadoEm: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at',
    },
    horarioFuncionamento: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'horario_funcionamento',
    },

  }, {
    timestamps: false,
    freezeTableName: true,
  });

  Empresa.associate = (models) => {
    Empresa.hasMany(models.Usuario, { foreignKey: 'empresa_id', as: 'usuarios' });
    Empresa.belongsToMany(models.Treinamento, {
      through: models.EmpresaTreinamento,
      foreignKey: 'empresa_id',
      otherKey: 'treinamento_id',
      as: 'treinamentos'
    });
    Empresa.hasOne(models.EmpresaSenha, { foreignKey: 'empresa_id', as: 'senha' });
  };

  return Empresa;
};
