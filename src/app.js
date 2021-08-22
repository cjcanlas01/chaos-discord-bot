require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS],
});
const {
  bootstrapCommands,
  bootstrapDiscordBot,
  bootstrapSlashCommands,
} = require("./utils/bootstrap");

client.commands = new Collection();
client.buttons = new Collection();
const commands = [];

bootstrapCommands(function (command) {
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}, "../commands");

// bootstrapCommands(function (command) {
//   client.buttons.set(command.name, command);
// }, "../interactions/button");

bootstrapSlashCommands(commands);
bootstrapDiscordBot(client);
