"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const msgs = [
      {
        guild: "MAD - Mass Destruction",
        guildId: "",
        channel: "welcome",
        message:
          "Hey {0}, welcome to MAD Discord :tada::hugging: ! Please change your name to the character in game with your Alliance tag in front. Example : [ABC] JohnDoe \n\nIf you're here to apply to MAD, please copy and paste the following message: \n`!iam Applicant`",
      },
      {
        guild: "K65 Discord",
        guildId: "",
        channel: "welcome",
        message:
          "Hey {0}, welcome to K65 Discord :tada::hugging: ! Please change your name to the character in game with your Alliance tag in front. Example : [ABC] JohnDoe",
      },
    ];
    return await queryInterface.bulkInsert("WelcomeMessages", msgs, {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete("WelcomeMessages", null, {});
  },
};
