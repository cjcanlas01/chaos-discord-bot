const { SlashCommandBuilder } = require("@discordjs/builders");
const { BANNERS } = require("../../config.json");
const Interaction = require("../utils/interaction");
const { generatePath } = require("../utils/path");
const { generateOptions } = require("../utils/utils");

/**
 * Identify and get taggable role
 *
 * @param {string} role
 * @param {Interaction} action
 * @returns {string}
 */
const identifyRole = (role, action) => {
  const defaultRole = ["HERE", "EVERYONE"];
  if (defaultRole.includes(role)) {
    return `@${role.toLowerCase()}`;
  }

  const ROLES = action.getBotConfigs();
  return action.getRoleTag(ROLES[role]);
};

/**
 * Get banner content
 *
 * @param {object} details
 * @param {Interaction} action
 * @returns {object}
 */
const displayBanner = (details, action) => {
  const { content, file, role } = { ...details };
  const taggableRole = identifyRole(role, action);
  let bannerContent = `${taggableRole}`;
  if (content) {
    bannerContent += content;
  }
  return {
    content: bannerContent,
    file,
  };
};

// Generate options
const generatedOptions = generateOptions(BANNERS, (key, value) => {
  return [value.description, key];
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banners")
    .setDescription("Display available guild banners.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Banner collection. Select one!")
        .setRequired(true)
        .addChoices(generatedOptions)
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const optionCode = action.getOptions().getString("options");
    const details = BANNERS[optionCode];
    const { content, file } = { ...displayBanner(details, action) };
    interaction.reply({
      content,
      files: [generatePath(`../assets/images/${file}`)],
    });
  },
};
