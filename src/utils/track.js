const db = require("../database/connection");
const { isArrayEmpty } = require("../utils/utils");
const { Op } = require("sequelize");

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
      raw: true,
    });
  }

  /**
   * Find protectors of specified castle name
   *
   * @param {string} castleName
   * @returns {array}
   */
  async findProtectors(castleName) {
    const listOfWatchers = await await db.Alts.findAll({
      where: {
        alts: {
          [Op.like]: `%${castleName.trim().toLowerCase()}%`,
        },
      },
      raw: true,
    });

    return listOfWatchers.map((user) => `<@${user.playerId}>`);
  }

  /**
   * Returns user's watch list
   *
   * @param {object} user
   * @returns {string}
   */
  async printWatchList(user) {
    const watchData = await this.getUserWatchList(user.id);
    const list = !isArrayEmpty(watchData) ? watchData[0].alts : null;
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
    const { id, username } = { ...user };
    const [, isCreated] = await db.Alts.upsert(
      {
        playerName: username,
        playerId: id,
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
