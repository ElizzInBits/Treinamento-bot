module.exports = (sequelize, DataTypes) => {
  const SessaoTreinamento = sequelize.define('SessaoTreinamento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tipo_treinamento: {
      type: DataTypes.STRING,
      allowNull: false
    },
    etapa_atual: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dados_sessao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultima_atualizacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sessoes_treinamentos',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return SessaoTreinamento;
};