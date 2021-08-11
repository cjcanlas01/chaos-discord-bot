const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { generatePath } = require("./path");
const { BOT_TOKEN, CLIENT_ID } = require("../config");
const config = require("../../config.json");

/**
 * Find all commands then bootstrap all of it bot
 *
 * @param {callback} action
 */
const bootstrapCommands = (action) => {
  const commandPath = generatePath("../commands");
  const commandFiles = fs
    .readdirSync(commandPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`${commandPath}/${file}`);
    action(command);
  }
};

/**
 * Set all commands into servers listed in config.json
 *
 * @param {array} commands
 */
const bootstrapSlashCommands = (commands) => {
  const rest = new REST({ version: "9" }).setToken(BOT_TOKEN);
  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");

      const { GUILDS } = { ...config };
      for (const info of GUILDS) {
        const { GUILD_ID } = { ...info };
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
          body: commands,
        });
      }

      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error(error);
      console.error("Something went wrong with (/) commands syncing.");
    }
  })();
};

/**
 * Start discord bot
 *
 * @param {Discord Client} client
 */
const bootstrapDiscordBot = (client) => {
  client.on("ready", () => {
    client.user.setActivity(`help`, { type: "LISTENING" });
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    if (!client.commands.has(interaction.commandName)) return;
    try {
      await client.commands.get(interaction.commandName).execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });

  client.login(BOT_TOKEN);
};

module.exports = {
  bootstrapCommands,
  bootstrapSlashCommands,
  bootstrapDiscordBot,
};
