module.exports = (sequelize, DataTypes) => {
    const Fluxo = sequelize.define('Fluxo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false
        },
        descricao: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        flowId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        versao: {
            type: DataTypes.STRING,
            defaultValue: '1.0'
        },
        inicio: {
            type: DataTypes.STRING,
            allowNull: false
        },
        nos: {
            type: DataTypes.JSON,
            allowNull: false
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        criadoEm: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        atualizadoEm: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'fluxos',
        timestamps: false
    });

    return Fluxo;
};
