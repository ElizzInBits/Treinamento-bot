const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AssinaturaCertificado = sequelize.define('AssinaturaCertificado', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'usuario_id'
    },
    certificadoPath: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'certificado_path'
    },
    assinaturaBase64: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'assinatura_base64'
    },
    tokenAssinatura: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'token_assinatura'
    },
    assinadoEm: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'assinado_em'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    status: {
      type: DataTypes.ENUM('pendente', 'assinado', 'expirado'),
      defaultValue: 'pendente'
    }
  }, {
    tableName: 'assinaturas_certificados',
    timestamps: true
  });

  AssinaturaCertificado.associate = function(models) {
    AssinaturaCertificado.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'usuario'
    });
  };

  return AssinaturaCertificado;
};