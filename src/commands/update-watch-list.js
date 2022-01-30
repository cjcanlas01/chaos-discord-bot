const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const DB = require("../utils/db");
const db = require("../database/connection");
const { checkIfUserIsAllowed } = require("../utils/utils");

/**
 * Parse discord guild member list,
 * get only nickname or username per user id
 *
 * @param {object} guildMemberList
 * @returns {object}
 */
const parseGuildMemberList = (guildMemberList) => {
  return guildMemberList.reduce((acc, value) => {
    const { id, username } = value.user;
    return {
      ...acc,
      [id]: value.nickname || username,
    };
  }, {});
};

/**
 * Update bot's recorded watch list
 * with obtained available user name
 *
 * @param {object} watchRecords
 * @param {object} parsedGuildMemberList
 * @returns {object}
 */
const applyMemberNames = (watchRecords, parsedGuildMemberList) => {
  return watchRecords.map((value) => {
    const { playerId } = value;
    return {
      playerId: playerId,
      name:
        parsedGuildMemberList[playerId] == undefined
          ? "NOT_IN_SERVER"
          : parsedGuildMemberList[playerId],
    };
  });
};

/**
 * Update database watch records
 *
 * @param {object} watchRecords
 */
const updateWatchRecords = async (watchRecords) => {
  for (const records of watchRecords) {
    const { playerId, name } = records;
    await db.Alts.update(
      { playerName: name },
      {
        where: {
          playerId: playerId,
        },
      }
    );
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("update-watch-list")
    .setDescription("Update server's watch list."),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const db = new DB();
    const isUserAllowed = await checkIfUserIsAllowed(action);

    if (!isUserAllowed) {
      await interaction.reply({
        content: "Warning! You have no permission for this command.",
        ephemeral: true,
      });
      return;
    }

    const watchRecords = await db.getWatchRecords();
    const guildMemberList = await action.getGuildMemberManager().this().fetch();
    const parsedGuildMemberList = parseGuildMemberList(guildMemberList);
    const updatedMemberNames = applyMemberNames(
      watchRecords,
      parsedGuildMemberList
    );
    await interaction.reply({
      content: "I'm working on it! Please wait...",
      ephemeral: true,
    });
    await updateWatchRecords(updatedMemberNames);
    await interaction.editReply({
      content: "Guild watch records updated!",
    });
  },
};
