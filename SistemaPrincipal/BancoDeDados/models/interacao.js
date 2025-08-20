module.exports = (sequelize, DataTypes) => {
    const Interacao = sequelize.define('Interacao', {
        telefone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        mensagem: {
            type: DataTypes.JSON,
            allowNull: false,
        },
    });

    return Interacao;
};
