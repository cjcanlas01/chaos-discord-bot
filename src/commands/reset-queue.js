const { SlashCommandBuilder } = require("@discordjs/builders");
const Queue = require("../utils/queue");
const { postSelf } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-queue")
    .setDescription("Request a title from Protocol Officer."),
  async execute(interaction) {
    const queue = new Queue(interaction);
    await queue.resetQueue();
    postSelf(interaction, "Queue has been cleared.");
  },
};
