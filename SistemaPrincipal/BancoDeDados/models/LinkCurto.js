const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LinkCurto = sequelize.define('LinkCurto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true,
      field: 'codigo'
    },
    urlCompleta: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'url_completa'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    acessos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'acessos'
    }
  }, {
    tableName: 'links_curtos',
    timestamps: true
  });

  return LinkCurto;
};