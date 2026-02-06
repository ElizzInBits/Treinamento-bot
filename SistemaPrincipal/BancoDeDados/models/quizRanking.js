const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizRanking = sequelize.define('QuizRanking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    treinamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_acertos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_questoes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_pontos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    dias_consecutivos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    melhor_sequencia: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    ultima_participacao: {
      type: DataTypes.DATEONLY,
      allowNull: true
    }
  }, {
    tableName: 'quiz_ranking',
    timestamps: true,
    underscored: true
  });

  QuizRanking.associate = (models) => {
    QuizRanking.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
    QuizRanking.belongsTo(models.Treinamento, {
      foreignKey: 'treinamento_id',
      as: 'treinamento'
    });
  };

  return QuizRanking;
};
