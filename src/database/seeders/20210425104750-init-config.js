"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const configs = [
      {
        config: "PO_ACCESS_ROLE",
        value: "poaccess",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "PO_ROLE",
        value: "Protocol Officer",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "QUEUE_CHANNEL",
        value: "title-queue",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "BUFF_CHANNEL",
        value: "buff-requests",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "BANK_ROLE",
        value: "Bank",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "DRAGON_RALLIES",
        value: "DragonRallies",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "CAMP_RALLIES",
        value: "CampRallies",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "BUFF_QUEUE_HEADER",
        value: "TITLE BUFF QUEUE",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        config: "ALLOWED_USERS",
        value: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return await queryInterface.bulkInsert("Configs", configs, {});
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.bulkDelete("Configs", null, {});
  },
};
