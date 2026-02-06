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
    status_treinamento: {
      type: DataTypes.STRING,
      defaultValue: 'não iniciado',
    },
    treinamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    empresa_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'empresa_id',
      references: {
        model: 'empresas',
        key: 'id',
      },
    },
    ultima_interacao: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cargo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do cargo'
    },
    setor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID do setor'
    },
    unidade_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID da unidade'
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
      { fields: ['empresa_id'] },
      { fields: ['status_treinamento'] }
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
      foreignKey: 'empresa_id',
      as: 'empresa' 
    });
    
    Usuario.belongsTo(models.Treinamento, {
      foreignKey: 'treinamento_id',
      as: 'treinamento'
    });
  };

  return Usuario;
};