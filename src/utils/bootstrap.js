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
 * @param {string} dirPath
 */
const bootstrapCommands = (action, dirPath) => {
  const commandPath = generatePath(dirPath);
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
 * @param {Client} client
 */
const bootstrapDiscordBot = (client) => {
  client.on("ready", () => {
    client.user.setActivity(`help`, { type: "LISTENING" });
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("interactionCreate", async (interaction) => {
    slashInteractions(client, interaction);
    buttonInteractions(client, interaction);
  });

  client.login(BOT_TOKEN);
};

const { interactionHandler } = require("./discord");

const slashInteractions = (client, interaction) => {
  if (interaction.isCommand()) {
    if (!client.commands.has(interaction.commandName)) return;
    interactionHandler(async function () {
      await client.commands.get(interaction.commandName).execute(interaction);
    }, interaction);
  }
};

const buttonInteractions = (client, interaction) => {
  if (interaction.isButton()) {
    const commandName = interaction.customId;
    if (!client.buttons.has(commandName)) return;
    interactionHandler(async function () {
      await client.buttons.get(commandName).execute(interaction);
    }, interaction);
  }
};

module.exports = {
  bootstrapCommands,
  bootstrapSlashCommands,
  bootstrapDiscordBot,
};
