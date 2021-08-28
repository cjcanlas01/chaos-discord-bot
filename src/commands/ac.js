const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const keyv = require("../utils/keyv");
const { post, postSelf } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ac")
    .setDescription("Enable/ disable attack titles for requesting.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Enable/ disable attack titles.")
        .setRequired(true)
        .addChoices([
          ["mode", "mode"],
          ["stop", "stop"],
        ])
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const queue = new Queue(interaction);
    const BUFF_MODE_KEY = queue.getBuffModeId();
    const option = action.getOptions().getString("options");
    const isOfficer = queue.checkUserIsOfficer();
    const isBuffRequestsChannel = await queue.checkIfBuffRequestsChannel();

    if (!isBuffRequestsChannel) {
      postSelf(interaction, "Warning! Cannot execute command here.");
      return;
    }

    if (!isOfficer) {
      postSelf(
        interaction,
        "Warning! You don't have the role for this command."
      );
      return;
    }

    switch (option) {
      case "mode":
        await keyv.set(BUFF_MODE_KEY, true);
        post(
          interaction,
          "`Alliance Conquest Buff Mode is ON! Regular titles are disabled! Get them LC buff!`"
        );
        break;
      case "stop":
        await keyv.set(BUFF_MODE_KEY, false);
        post(
          interaction,
          "`Alliance Conquest Buff Mode is OFF! Regular titles are enabled! Get them!`"
        );
        break;
    }
  },
};
