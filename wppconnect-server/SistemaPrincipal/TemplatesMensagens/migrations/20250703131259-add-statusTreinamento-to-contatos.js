'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('contatos', 'statusTreinamento', {
      type: Sequelize.STRING,
      defaultValue: 'não iniciado',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('contatos', 'statusTreinamento');
  },
};

