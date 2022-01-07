"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const msgs = [
      {
        guild: "",
        guildId: "",
        channel: "welcome",
        message: "Hey {0}, welcome to our discord!",
      },
    ];
    return await queryInterface.bulkInsert("WelcomeMessages", msgs, {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete("WelcomeMessages", null, {});
  },
};
