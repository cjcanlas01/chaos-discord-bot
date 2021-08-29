const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const {
  bootstrapCommands,
  updateCommandOptions,
  bootstrapBotConfigs,
  bootstrapSlashCommands,
} = require("../utils/bootstrap");
const { postSelf } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset bot commands and configs."),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const client = action.getClient().this();
    const commands = [];

    await bootstrapCommands(async function (command) {
      const updatedCommand = await updateCommandOptions(command.data.toJSON());
      commands.push(updatedCommand);
      client.commands.set(command.data.name, command);
    }, "../commands");

    bootstrapSlashCommands(commands);
    bootstrapBotConfigs(client);

    postSelf(interaction, "Bot commands and configs reloaded.");
  },
};
