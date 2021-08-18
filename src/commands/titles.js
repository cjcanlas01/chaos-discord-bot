const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const { FARM_TITLES, ATK_TITLES } = require("../utils/constant");

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
  const commands = [];
  for (const [key, value] of Object.entries(collection)) {
    commands.push([value, key]);
  }
  return commands;
};

/**
 * Get request details
 *
 * @param {Interaction} action
 * @returns {object}
 */
const requestDetails = async (action) => {
  const titleCommand = action.getOptions().getSubcommand();
  const username = await action.availableUserName();
  if (titleCommand == "farm") {
    return {
      title: FARM_TITLES[action.getOptions().getString("farm_titles")],
      username,
    };
  }
  if (titleCommand == "atk") {
    return {
      title: ATK_TITLES[action.getOptions().getString("atk_titles")],
      username,
    };
  }
  if (titleCommand == "done") {
    return { username };
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
    const { title, username } = { ...(await requestDetails(action)) };
    const isOfficerOnline = queue.isOfficerOnline();

    if (isOfficerOnline) {
      interaction.reply({
        content: "No Protocol Officer online. Please try again later.",
        ephemeral: true,
      });
      return;
    }

    if (title) {
      const role = await queue.getOfficerRole();
      const result = await queue.addPlayerInQueue(title, username);
      if (result) {
        interaction.reply(notifyOfficer(role, title, username));
      } else {
        interaction.reply({
          content: `\`${username}\` is already in a queue.`,
          ephemeral: true,
        });
      }
    } else {
      const result = await queue.removePlayerInQueue(username);
      if (result) {
        interaction.reply({
          content: `\`${username}\` is removed from the queue.`,
          ephemeral: true,
        });
      } else {
        interaction.reply({
          content: `\`${username}\` is not in a queue.`,
          ephemeral: true,
        });
      }
    }
  },
};
