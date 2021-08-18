const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");

const computeNeededMaterials = (quantity, quality) => {
  let computedQty;
  switch (quality) {
    case "green":
      computedQty = quantity * 4;
      break;

    case "blue":
      computedQty = quantity * 16;
      break;

    case "purple":
      computedQty = quantity * 64;
      break;

    case "gold":
      computedQty = quantity * 256;
      break;
  }

  return `You need ${computedQty} grey material for ${quality} quality.`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("material")
    .setDescription("Compute how much material need for quality specified.")
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("The quantity needed.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("quality")
        .setDescription("The quality needed.")
        .addChoices([
          ["Green", "green"],
          ["Blue", "blue"],
          ["Purple", "purple"],
          ["Gold", "gold"],
        ])
        .setRequired(true)
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const quantity = action.getOptions().getInteger("quantity");
    const quality = action.getOptions().getString("quality");
    await interaction.reply(computeNeededMaterials(quantity, quality));
  },
};
