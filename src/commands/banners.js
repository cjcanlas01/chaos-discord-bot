const { SlashCommandBuilder } = require("@discordjs/builders");
const { getConfigs } = require("../config");
const Interaction = require("../utils/interaction");
const { generatePath } = require("../utils/path");

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
    return {
      tag: `@${role.toLowerCase()}`,
    };
  }

  const selectedRole = action.getBotConfigs()[role];
  return {
    tag: action.getRoleTag(selectedRole),
    id: action.getRoleId(selectedRole),
  };
};

/**
 * Get banner content
 *
 * @param {object} details
 * @param {Interaction} action
 * @returns {object}
 */
const displayBanner = (details, action) => {
  const { content, file, role } = details;
  const { tag, id } = identifyRole(role, action);
  let bannerContent = `${tag}`;
  if (content) {
    bannerContent += content;
  }

  const banner = {
    content: bannerContent,
    file,
  };

  if (id) {
    banner.roleIds = id;
  }

  return banner;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("banners")
    .setDescription("Display available guild banners.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Banner collection. Select one!")
        .setRequired(true)
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const optionCode = action.getOptions().getString("options");
    const { BANNERS } = await getConfigs();
    const details = BANNERS[optionCode];
    const { content, roleIds, file } = displayBanner(details, action);
    const message = {
      content,
      files: [generatePath(`../assets/images/${file}`)],
    };

    if (roleIds) {
      message.allowedMentions = { roles: [roleIds] };
    } else {
      message.allowedMentions = { parse: ["everyone"] };
    }

    interaction.reply(message);
  },
};
