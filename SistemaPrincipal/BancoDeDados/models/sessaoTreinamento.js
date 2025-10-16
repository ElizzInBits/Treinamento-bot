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
    tipoTreinamento: {
      type: DataTypes.STRING,
      allowNull: false
    },
    etapaAtual: {
      type: DataTypes.STRING,
      allowNull: false
    },
    dadosSessao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimaAtualizacao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'sessoes_treinamentos',
    timestamps: true
  });

  return SessaoTreinamento;
};