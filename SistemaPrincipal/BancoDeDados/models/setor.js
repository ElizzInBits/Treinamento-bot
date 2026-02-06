module.exports = (sequelize, DataTypes) => {
  const Setor = sequelize.define('setores', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    unidadeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'unidade_id'
    },
    nome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'setores',
    timestamps: true,
    created_at: 'created_at',
    updated_at: 'updated_at'
  });

  return Setor;
};
