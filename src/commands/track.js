const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Track = require("../utils/track");
const { post } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track")
    .setDescription(
      "Track castles you care about. Get notified if something happened to them."
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("watch")
        .setDescription("Save or update your watch record.")
        .addStringOption((option) =>
          option
            .setName("castle_name")
            .setDescription("Your watch record. [name separated by comma]")
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unbubbled")
        .setDescription("Tags players that has the castle recorded in.")
        .addStringOption((option) =>
          option
            .setName("castle_name")
            .setDescription("The castle to watch.")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const track = new Track();
    const subcommand = action.getOptions().getSubcommand();
    const castleName = action.getOptions().getString("castle_name");

    switch (subcommand) {
      case "watch":
        const user = action.getUser().this();
        const watchMessage = !castleName
          ? await track.printWatchList(user)
          : await track.updateOrInsert(user, castleName);
        post(interaction, watchMessage);
        break;
      case "unbubbled":
        const players = await track.findProtectors(castleName);
        const unbubbledMessage =
          players.length == 0
            ? track.messages.PROTECTOR_NOT_FOUND
            : track.messages.PROTECTORS_FOUND(players, castleName);
        post(interaction, unbubbledMessage);
        break;
    }
  },
};
