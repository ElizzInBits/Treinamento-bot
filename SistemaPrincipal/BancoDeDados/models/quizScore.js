const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizScore = sequelize.define('QuizScore', {
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
    data_quiz: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    acertos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    total_questoes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    pontuacao: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tempo_resposta: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tempo em segundos'
    }
  }, {
    tableName: 'quiz_scores',
    timestamps: true,
    underscored: true
  });

  QuizScore.associate = (models) => {
    QuizScore.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });
    QuizScore.belongsTo(models.Treinamento, {
      foreignKey: 'treinamento_id',
      as: 'treinamento'
    });
  };

  return QuizScore;
};
