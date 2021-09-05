const db = require("../database/connection");

module.exports = class DB {
  constructor() {}

  async getBankLists() {
    return await db.Bank.findAll({
      attributes: ["name", "transport_tax", "transport_amount"],
      raw: true,
    });
  }

  async getConfigList() {
    return await db.Config.findAll({
      attributes: ["config", "value"],
      raw: true,
    });
  }

  async getWelcomeMessagesList() {
    return await db.WelcomeMessage.findAll({
      attributes: ["guildId", "channel", "message"],
      raw: true,
    });
  }

  async getWatchRecords() {
    return await db.Alts.findAll({
      attributes: ["playerId"],
      raw: true,
    });
  }

  async getConfig(config) {
    return await db.Config.findOne({
      where: {
        config: config,
      },
      attributes: ["config", "value"],
      raw: true,
    });
  }
};
