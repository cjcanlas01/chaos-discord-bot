require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});
const {
  bootstrapCommands,
  bootstrapDiscordBot,
  bootstrapSlashCommands,
  bootstrapBotConfigs,
  updateCommandOptions,
} = require("./utils/bootstrap");

// client.buttons = new Collection();
client.commands = new Collection();
client.welcomeMessages = new Collection();
client.banks = new Collection();
client.configs = new Collection();

(async () => {
  const commands = [];

  await bootstrapCommands(async function (command) {
    const updatedCommand = await updateCommandOptions(command.data.toJSON());
    commands.push(updatedCommand);
    client.commands.set(command.data.name, command);
  }, "../commands");

  // bootstrapCommands(function (command) {
  //   client.buttons.set(command.name, command);
  // }, "../interactions/button");

  bootstrapSlashCommands(commands);
  bootstrapBotConfigs(client);
  bootstrapDiscordBot(client);
})();
