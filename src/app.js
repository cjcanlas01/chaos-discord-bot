require("dotenv").config();
const { Client, Collection, Intents } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const {
  bootstrapCommands,
  bootstrapDiscordBot,
  bootstrapSlashCommands,
} = require("./utils/bootstrap");

client.commands = new Collection();
const commands = [];

bootstrapCommands(function (command) {
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
});

bootstrapSlashCommands(commands);
bootstrapDiscordBot(client);
