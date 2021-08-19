const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const keyv = require("../utils/keyv");

// Generate keyv guild key
const getBuffModeKey = (guildId) => {
  return `${guildId}_BUFF_MODE`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ac")
    .setDescription("Protocol Officer commands.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Protocol Officer command options.")
        .setRequired(true)
        .addChoices([
          ["mode", "mode"],
          ["stop", "stop"],
        ])
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const queue = new Queue(interaction);
    const BUFF_MODE_KEY = getBuffModeKey(action.getGuildId());
    const option = action.getOptions().getString("options");
    const isOfficer = queue.checkUserIsOfficer();
    const isBuffRequestsChannel = await queue.checkIfBuffRequestsChannel();

    if (!isBuffRequestsChannel) {
      interaction.reply({
        content: "Warning! Cannot execute command here.",
        ephemeral: true,
      });
      return;
    }

    if (!isOfficer) {
      interaction.reply({
        content: "Warning! You don't have the role for this command.",
        ephemeral: true,
      });
      return;
    }

    switch (option) {
      case "mode":
        await keyv.set(BUFF_MODE_KEY, true);
        interaction.reply({
          content:
            "`Alliance Conquest Buff Mode is ON! Regular titles are disabled! Get them LC buff!`",
        });
        break;
      case "stop":
        await keyv.set(BUFF_MODE_KEY, false);
        interaction.reply({
          content:
            "`Alliance Conquest Buff Mode is OFF! Regular titles are enabled! Get them!`",
        });
        break;
    }
  },
};
