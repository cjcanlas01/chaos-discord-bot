const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

const interactionHandler = async (action, interaction) => {
  try {
    action();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
};

/**
 * Return MessageEmbed
 * - Represents an embed in a message (image/video preview, rich embed, etc.)
 * - Reference: https://discord.js.org/#/docs/main/stable/class/MessageEmbed
 *
 * @param {object} fields
 * @param {string} title
 * @param {string} footer
 * @returns {MessageEmbed}
 */
const embed = (fields, title = null, footer = null) => {
  title = !title ? "GOT IS HERE! HOW CAN I HELP?" : title;
  footer = !footer ? "Developed by: Q Coldwater#1395" : footer;
  return new MessageEmbed()
    .setTitle(title)
    .setColor(0xff0000)
    .addFields(fields)
    .setFooter(footer);
};

/**
 * Return MessageButton
 * - Represents a button message component
 * - Reference: https://discord.js.org/#/docs/main/stable/class/MessageButton
 *
 * @param {string} id
 * @param {string} label
 * @returns {MessageButton}
 */
const button = (id, label) => {
  return new MessageActionRow().addComponents(
    new MessageButton().setCustomId(id).setLabel(label).setStyle("PRIMARY")
  );
};

module.exports = {
  interactionHandler,
  embed,
  button,
};
