const { SlashCommandBuilder } = require("@discordjs/builders");
const Queue = require("../utils/queue");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-queue")
    .setDescription("Request a title from Protocol Officer."),
  async execute(interaction) {
    const queue = new Queue(interaction);
    await queue.resetQueue();
    interaction.reply({
      content: "Queue has been cleared.",
      ephemeral: true,
    });
  },
};
