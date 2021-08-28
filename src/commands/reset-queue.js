const { SlashCommandBuilder } = require("@discordjs/builders");
const Queue = require("../utils/queue");
const { postSelf } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-queue")
    .setDescription("Reset queue in title-queue channel."),
  async execute(interaction) {
    const queue = new Queue(interaction);
    const isBuffRequestsChannel = await queue.checkIfBuffRequestsChannel();

    if (!isBuffRequestsChannel) {
      postSelf(interaction, "Warning! Cannot execute command here.");
      return;
    }

    await queue.resetQueue();
    postSelf(interaction, "Queue has been cleared.");
  },
};
