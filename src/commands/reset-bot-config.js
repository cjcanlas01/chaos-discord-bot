const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const {
  bootstrapCommands,
  updateCommandOptions,
  bootstrapBotConfigs,
  bootstrapSlashCommands,
} = require("../utils/bootstrap");
const { postSelf, checkIfUserIsAllowed } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-bot-config")
    .setDescription("Reset bot commands and configs."),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const client = action.getClient().this();
    const commands = [];
    const isUserAllowed = await checkIfUserIsAllowed(action);

    if (!isUserAllowed) {
      await interaction.reply({
        content: "Warning! You have no permission for this command.",
        ephemeral: true,
      });
      return;
    }

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
