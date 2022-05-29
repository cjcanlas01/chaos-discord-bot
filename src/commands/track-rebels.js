const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const { initializeSheet } = require("../utils/google-spreadsheet");
const { getConfigs } = require("../config");
const { postSelf, checkIfUserIsAllowed } = require("../utils/utils");
const FTP = require('ftp')
const c = new FTP();

const INTERACTION_MESSAGE = {
  START_PROCESS: "I'm working on it! Please wait...",
  END_PROCESS: "Rebels list updated!",
};

const parseRebelsList = (csv) => {
  const { data } = Papa.parse(csv, { skipEmptyLines: true });
  return data.map((rows) => {
    return rows
      .filter((row) => row.length > 0)
      .map((row) => row.replace(";", ""));
  });
};

const getRebelsCSV = (path) => {
  const csvPath = path.resolve(__dirname, "../../rebels.csv");
  return fs.readFileSync(csvPath, "utf8");
};

const getRebelsCSV_FTP = () => {
  const csvPath = path.resolve(__dirname, "../../rebels.csv");
  c.connect({
    host: "mad.psykoral.com",
    user: "madgotwic",
    password: "Ai7USLJ3"
  });

  c.on('ready', function() {
    c.get('/mad.psykoral.com/rebels.csv', function(err, stream) {
      if (err) throw err;
      stream.once('close', function() { ftp_client.end(); });
      stream.pipe(fs.createWriteStream(csvPath));
    });
  });

  return fs.readFileSync(csvPath, "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track-rebels")
    .setDescription("Track rebel leaders."),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const { TRACK_REBELS } = await getConfigs();
    const rebelsList = getRebelsCSV_FTP();
    const isUserAllowed = await checkIfUserIsAllowed(action);

    if (!isUserAllowed) {
      await interaction.reply({
        content: "Warning! You have no permission for this command.",
        ephemeral: true,
      });
      return;
    }

    if (!rebelsList) {
      postSelf("No file found!");
      return;
    }

    await interaction.reply(INTERACTION_MESSAGE.START_PROCESS);
    const sheetContents = parseRebelsList(rebelsList);
    const sheet = await initializeSheet();
    const weeklyData = sheet.sheetsByTitle[TRACK_REBELS.REBEL_DATA]
    const secondRow = await weeklyData.getRows({offset: 1})
    console.log(secondRow[0].length)
    console.log(rows[0])
    // const rlSheet = sheet.sheetsByTitle[TRACK_REBELS.SHEET];
    // await rlSheet.clear(TRACK_REBELS.RANGE);
    // Remove header as already existing in the sheet
    sheetContents.shift();
    await rlSheet.addRows(sheetContents);
    await interaction.editReply({
      content: INTERACTION_MESSAGE.END_PROCESS,
    });
  },
};
