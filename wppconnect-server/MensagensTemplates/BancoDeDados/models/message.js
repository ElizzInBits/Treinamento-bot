const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Message = sequelize.define('message', {
  sender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  receivedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Message;
