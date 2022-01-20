const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { generatePath } = require("./path");
const { BOT_TOKEN, CLIENT_ID, BOT_HELP_COMMAND } = require("../env-config");
const { getConfigs } = require("../config");
const {
  isArrayEmpty,
  stringInject,
  postSelf,
  arrayFindPropertyByName,
} = require("../utils/utils");
const DB = require("../utils/db");
const Interaction = require("../utils/interaction");
const { interactionHandler } = require("./discord");

/**
 * Save database config records to discord collection
 *
 * @param {Client} client
 */
const bootstrapBotConfigs = async (client) => {
  const db = new DB();
  const bank = await db.getBankLists();
  const welcomeMessages = await db.getWelcomeMessagesList();
  const configs = await db.getConfigList();

  client.banks.clear();
  client.welcomeMessages.clear();
  client.configs.clear();

  bank.forEach((value) => {
    const { name, transport_tax, transport_amount } = value;
    client.banks.set(name, {
      transport_tax,
      transport_amount,
    });
  });

  welcomeMessages.forEach((value) => {
    const { guildId, channel, message } = value;
    client.welcomeMessages.set(guildId, {
      channel,
      message,
    });
  });

  configs.forEach((record) => {
    const { config, value } = record;
    client.configs.set(config, value);
  });
};

/**
 * Find all commands then bootstrap all of it bot
 *
 * @param {callback} action
 * @param {string} dirPath
 */
const bootstrapCommands = async (action, dirPath) => {
  const commandPath = generatePath(dirPath);
  const commandFiles = fs
    .readdirSync(commandPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = require(`${commandPath}/${file}`);
    await action(command);
  }
};

/**
 * Set all commands into servers listed in config.json
 *
 * @param {array} commands
 */
const bootstrapSlashCommands = (commandsList) => {
  const rest = new REST({ version: "9" }).setToken(BOT_TOKEN);
  (async () => {
    try {
      console.log("Started refreshing application (/) commands.");
      const { GUILDS } = await getConfigs();
      for (const info of GUILDS) {
        const { GUILD_ID, COMMAND_FILTER } = info;
        const commands = isArrayEmpty(COMMAND_FILTER)
          ? commandsList
          : commandsList.filter(
              (command) => !COMMAND_FILTER.includes(command.name)
            );
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
    client.user.setActivity(`${BOT_HELP_COMMAND}help`, {
      type: "LISTENING",
    });
    console.log(`Logged in as ${client.user.tag}!`);
  });

  client.on("interactionCreate", (interaction) => {
    slashInteractions(client, interaction);
    // buttonInteractions(client, interaction);
  });

  client.on("guildMemberAdd", (member) => {
    const guildConfig = config.GUILDS.find(
      (config) => config.GUILD_ID == member.guild.id
    );
    if (guildConfig != undefined && guildConfig.WELCOME_MSG) {
      displayWelcomeMessage(member);
    }
  });

  client.login(BOT_TOKEN);
};

const slashInteractions = (client, interaction) => {
  if (interaction.isCommand()) {
    if (!client.commands.has(interaction.commandName)) return;
    interactionHandler(async function () {
      try {
        await client.commands.get(interaction.commandName).execute(interaction);
      } catch (error) {
        const ERROR_MESSAGE = `\`\`\`${error.name}: ${error.message} \n\nContact Q Coldwater #1395 asap.\`\`\``;
        postSelf(interaction, ERROR_MESSAGE);
      }
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

/**
 * Update commands with dynamic options
 *
 * @param {object} command
 * @returns {object}
 */
const updateCommandOptions = async (command) => {
  const db = new DB();
  switch (command.name) {
    case "bank-request":
      const option = arrayFindPropertyByName(command.options, "bank");
      const banks = await db.getBankLists();
      const banksOption = banks.map((bank) => {
        const { name } = bank;
        return {
          name,
          value: name,
        };
      });
      option.choices = banksOption;
      return command;
    case "banners":
      const options = arrayFindPropertyByName(command.options, "options");
      const { BANNERS } = await getConfigs();
      const banners = Object.entries(BANNERS).map((banner) => {
        const [id, value] = banner;
        return {
          name: value.description,
          value: id,
        };
      });
      options.choices = banners;
      return command;
  }
  return command;
};

/**
 * Display welcome message on guildMemberAdd event
 *
 * @param {object} member
 */
const displayWelcomeMessage = (member) => {
  const guild = member.guild;
  const action = new Interaction(member);
  const { channel, message } = action
    .getClient()
    .this()
    .welcomeMessages.get(guild.id);
  const welcomeChannel = guild.channels.cache.find((ch) => ch.name == channel);
  const welcomeMessage = stringInject(message, [member.toString()]);
  welcomeChannel.send(welcomeMessage);
};

module.exports = {
  bootstrapCommands,
  bootstrapSlashCommands,
  bootstrapDiscordBot,
  bootstrapBotConfigs,
  updateCommandOptions,
};
