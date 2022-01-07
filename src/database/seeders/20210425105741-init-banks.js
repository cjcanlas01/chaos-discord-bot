"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const configs = [
      {
        name: "BANK",
        transport_tax: "7",
        transport_amount: "6760000",
      },
    ];
    return await queryInterface.bulkInsert("Banks", configs, {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete("Banks", null, {});
  },
};
