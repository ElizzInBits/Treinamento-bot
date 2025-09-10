const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Template = sequelize.define('Template', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    chave: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    conteudo: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING(50),
        defaultValue: 'geral'
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'templates',
    timestamps: true
});

module.exports = Template;