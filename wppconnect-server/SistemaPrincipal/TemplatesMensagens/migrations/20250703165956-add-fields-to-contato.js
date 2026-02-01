'use strict';

/** @type {import('sequelize-cli').Migration} */
// migrations/20230702123456-add-fields-to-contato.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Contatos', 'nomeCompleto', {
      type: Sequelize.STRING,
      allowNull: true, // Se você quiser que esse campo seja opcional
    });
    await queryInterface.addColumn('Contatos', 'email', {
      type: Sequelize.STRING,
      allowNull: true, // Se você quiser que esse campo seja opcional
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Contatos', 'nomeCompleto');
    await queryInterface.removeColumn('Contatos', 'email');
  }
};

