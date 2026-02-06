const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TreinamentoVariante = sequelize.define('TreinamentoVariante', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    treinamentoBaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'treinamento_base_id'
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'empresa_id'
    },
    nomeVariante: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'nome_variante'
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    conteudoCustomizado: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'conteudo_customizado'
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'treinamentos_variantes',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  TreinamentoVariante.associate = (models) => {
    TreinamentoVariante.belongsTo(models.Treinamento, {
      foreignKey: 'treinamentoBaseId',
      as: 'treinamentoBase'
    });
    TreinamentoVariante.belongsTo(models.Empresa, {
      foreignKey: 'empresaId',
      as: 'empresa'
    });
  };

  return TreinamentoVariante;
};
