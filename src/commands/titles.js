const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const keyv = require("../utils/keyv");
const { FARM_TITLES, ATK_TITLES } = require("../utils/constant");
const { generateOptions, post, postSelf } = require("../utils/utils");

/**
 * Return template message for officer
 *
 * @param {string} role
 * @param {string} title
 * @param {string} name
 * @returns {string}
 */
const notifyOfficer = (role, title, name) => {
  return `${role} please assign \`${title}\` to \`${name}.\``;
};

/**
 * Format constant titles object to interaction command options
 *
 * @param {object} collection
 * @returns {array}
 */
const generateCommands = (collection) => {
  return generateOptions(collection, (key, value) => {
    return [value, key];
  });
};

/**
 * Get request details
 *
 * @param {Interaction} action
 * @returns {object}
 */
const requestDetails = async (action, queue) => {
  const titleCommand = action.getOptions().getSubcommand();
  const username = await action.availableUserName();
  const buffModeStatus = await keyv.get(queue.getBuffModeId());
  if (titleCommand == "farm") {
    return {
      status: "request",
      title: FARM_TITLES[action.getOptions().getString("farm_titles")],
      username,
    };
  }
  if (titleCommand == "atk") {
    if (!buffModeStatus) {
      return {
        status: "unavailable",
      };
    }
    return {
      status: "request",
      title: ATK_TITLES[action.getOptions().getString("atk_titles")],
      username,
    };
  }
  if (titleCommand == "done") {
    return { status: "done", username };
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("titles")
    .setDescription("Request a title from Protocol Officer.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("farm")
        .setDescription("Titles that can help you grow your castle.")
        .addStringOption((option) =>
          option
            .setName("farm_titles")
            .setDescription("King's Landing Title")
            .setRequired(true)
            .addChoices(generateCommands(FARM_TITLES))
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to give titles, defaults to self.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("atk")
        .setDescription("Titles that can help you kill troops.")
        .addStringOption((option) =>
          option
            .setName("atk_titles")
            .setDescription("King's Landing Title")
            .setRequired(true)
            .addChoices(generateCommands(ATK_TITLES))
        )
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to give titles, defaults to self.")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("done")
        .setDescription("Use when you have completed using the title.")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("User to give titles, defaults to self.")
        )
    ),
  async execute(interaction) {
    const queue = new Queue(interaction);
    const action = new Interaction(interaction);
    const isOfficerOnline = await queue.isOfficerOnline();
    const { status, title, username } = {
      ...(await requestDetails(action, queue)),
    };
    const {
      NO_OFFICER_IN_SESSION,
      PLAYER_IN_QUEUE,
      PLAYER_REMOVED_IN_QUEUE,
      PLAYER_NOT_IN_QUEUE,
      PVP_TITLES_NOT_AVAILABLE,
    } = { ...queue.MESSAGES };

    if (!isOfficerOnline) {
      postSelf(interaction, NO_OFFICER_IN_SESSION);
      return;
    }

    switch (status) {
      case "request":
        const role = await queue.getTaggableOfficerRole();
        const isAdded = await queue.addPlayerInQueue(title, username);
        if (isAdded) {
          post(interaction, notifyOfficer(role, title, username));
        } else {
          post(interaction, PLAYER_IN_QUEUE(username));
        }
        break;
      case "done":
        const isRemoved = await queue.removePlayerInQueue(username);
        if (isRemoved) {
          postSelf(interaction, PLAYER_REMOVED_IN_QUEUE(username));
        } else {
          postSelf(interaction, PLAYER_NOT_IN_QUEUE(username));
        }
        break;
      case "unavailable":
        postSelf(interaction, PVP_TITLES_NOT_AVAILABLE);
    }
  },
};
