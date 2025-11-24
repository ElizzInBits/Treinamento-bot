const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Usuario = sequelize.define('usuarios', {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    sexo: {
      type: DataTypes.ENUM('masculino', 'feminino', 'outro'),
      allowNull: true,
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
    cargo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Cargo do funcionário'
    },
    setor: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Setor do funcionário'
    },
    ativo: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1 = Ativo, 0 = Inativo'
    },
  }, {
    timestamps: false,
    freezeTableName: true,
    indexes: [
      { fields: ['telefone'] },
      { fields: ['empresaId'] },
      { fields: ['statusTreinamento'] }
    ],
    hooks: {
      beforeDestroy: async (usuario, options) => {
        const { SessaoTreinamento, Interacao } = sequelize.models;
        await SessaoTreinamento.destroy({ where: { telefone: usuario.telefone }, transaction: options.transaction });
        await Interacao.destroy({ where: { telefone: usuario.telefone }, transaction: options.transaction });
        console.log(`✅ Sessões e interações removidas para: ${usuario.telefone}`);
      }
    }
  });

  Usuario.associate = (models) => {
    Usuario.belongsTo(models.Empresa, {
      foreignKey: 'empresaId',
      as: 'empresa' 
    });
    
    Usuario.belongsTo(models.Treinamento, {
      foreignKey: 'treinamentoId',
      as: 'treinamento'
    });
  };

  return Usuario;
};