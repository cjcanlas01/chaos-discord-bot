const db = require("../database/connection");
const { isArrayEmpty } = require("../utils/utils");

module.exports = class Watch {
  constructor() {
    this.messages = {
      PROTECTOR_NOT_FOUND: "Protectors not found!",
      PROTECTORS_FOUND: (protectors, castleName) =>
        `Hey ${protectors.join(" ")}, ${castleName} is unbubbled!`,
    };
  }

  /**
   * Get user watch list
   *
   * @param {string} playerId
   * @returns {object}
   */
  async getUserWatchList(playerId) {
    return await db.Alts.findAll({
      attributes: ["alts"],
      where: {
        playerId,
      },
    });
  }

  /**
   * Get all watch records
   *
   * @returns {object}
   */
  async getWatchRecords() {
    return await db.Alts.findAll({
      attributes: ["playerId", "alts"],
    });
  }

  /**
   * Returns parsed watch records
   *
   * @returns {object}
   */
  async parseWatchRecords() {
    const records = await this.getWatchRecords();
    return records.map((alt) => {
      const { playerId, alts } = { ...alt.dataValues };
      return {
        playerId,
        alts: new Set(alts.split(",").map((name) => name.trim().toLowerCase())),
      };
    });
  }

  /**
   * Find protectors of specified castle name
   *
   * @param {string} castleName
   * @returns {array}
   */
  async findProtectors(castleName) {
    const parsedRecords = await this.parseWatchRecords();
    return parsedRecords
      .filter((players) => {
        if (players.alts.has(castleName.trim().toLowerCase())) {
          return true;
        }
      })
      .map((user) => `<@${user.playerId}>`);
  }

  /**
   * Returns user's watch list
   *
   * @param {object} user
   * @returns {string}
   */
  async printWatchList(user) {
    const watchData = await this.getUserWatchList(user.id);
    const list = !isArrayEmpty(watchData) ? watchData[0].dataValues.alts : null;
    return list
      ? `${user.toString()}, your current watch list is: ${list}`
      : `Seems I can't find your watch list, have you added any characters yet?`;
  }

  /**
   * Update or insert user's watch list
   *
   * @param {object} user
   * @param {string} args
   * @returns {string}
   */
  async updateOrInsert(user, args) {
    const [, isCreated] = await db.Alts.upsert(
      {
        playerId: user.id,
        alts: args,
      },
      {
        returning: true,
      }
    );
    const createdText = isCreated ? "added" : "updated";
    return `${user.toString()}, your watch record has been ${createdText}.`;
  }
};
