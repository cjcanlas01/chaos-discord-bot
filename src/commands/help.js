const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const { embed } = require("../utils/discord");
const config = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(`${config.BOT.HELP_COMMAND}help`)
    .setDescription(`Display available guild commands.`),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const commands = action.getClientCommands();
    const guildId = action.getGuild().this().id;
    const guild = config.GUILDS.find((guild) => guild.GUILD_ID == guildId);
    const { COMMAND_FILTER } = { ...guild };
    const helpDetails = commands
      .filter((command) => !COMMAND_FILTER.includes(command.data.name))
      .map((command) => {
        const { name, description } = { ...command.data };
        return {
          name: `/${name}`,
          value: description,
        };
      });

    interaction.reply({
      embeds: [embed(helpDetails, `Available Guild Commands`)],
    });
  },
};
