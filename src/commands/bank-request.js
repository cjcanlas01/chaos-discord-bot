const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const { BANKS } = require("../utils/constant");
const { generateOptions, computeRequestCount } = require("../utils/utils");
const { embed } = require("../utils/discord");

// Generate options
const generatedOptions = generateOptions(BANKS, (key) => {
  return [key, key];
});

/**
 * Parse request of user and identify if its correct
 *
 * @param {object} request
 * @returns {object}
 */
const parseRequest = (request) => {
  const parsedRequest = request.split(" ").map((rss) => rss.split("-"));
  return {
    status: parsedRequest.every((rss) => rss.length == 2),
    requests: parsedRequest,
  };
};

/**
 * Compute request and get bank delivery instructions
 *
 * @param {object} bankDetail
 * @param {object} request
 * @returns {object}
 */
const processRequest = (bankDetail, request) => {
  const processedRequest = [];
  for (const req of request) {
    const [rssType, amount] = req;
    const load = computeRequestCount(bankDetail, amount);

    if (!load) {
      return "Set transport tax and amount first!";
    }

    processedRequest.push({
      name: `__${rssType.charAt(0).toUpperCase() + rssType.slice(1)}__`,
      value: `**Amount**: ${amount} million.
      ---
      ${load}`,
      inline: true,
    });
  }

  return processedRequest;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bank-request")
    .setDescription("Compute bank request.")
    .addStringOption((option) =>
      option
        .setName("bank")
        .setDescription("This is our banks!")
        .addChoices(generatedOptions)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("request")
        .setDescription("Write your bank request!")
        .setRequired(true)
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const bank = action.getOptions().getString("bank");
    const request = action.getOptions().getString("request");
    const { status, requests } = parseRequest(request);
    const bankDetails = BANKS[bank];
    if (status) {
      const result = processRequest(bankDetails, requests);
      if (typeof result == "object") {
        interaction.reply({
          embeds: [
            embed(result, `Bank Request Report \nSelected Bank: ${bank}`),
          ],
        });
      }
    } else {
      interaction.reply({
        content: "Something went wrong with processing your request.",
        ephemeral: true,
      });
    }
  },
};
