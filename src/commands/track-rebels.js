const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Papa = require("papaparse");
const fs = require("fs");
const path = require("path");
const { initializeSheet } = require("../utils/google-spreadsheet");
const { getConfigs } = require("../config");
const { postSelf, checkIfUserIsAllowed } = require("../utils/utils");
const FTP = require("ftp");
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

const getRebelsCSV_FTP = (path) => {
  const csvPath = path.resolve(__dirname, "../../rebels.csv");
  c.connect({
    host: "mad.psykoral.com",
    user: "madgotwic",
    password: "Ai7USLJ3",
  });

  c.on("ready", function () {
    c.get("/mad.psykoral.com/rebels.csv", function (err, stream) {
      if (err) throw err;
      stream.once("close", function () {
        c.end();
      });
      stream.pipe(fs.createWriteStream(csvPath));
    });
  });

  return fs.readFileSync(csvPath, "utf8");
};

const updateWeeklyContributionCells = async (sheet, column, data) => {
  await sheet.loadCells();
  for (let r = 0; r < 100; r++) {
    let row = r + 2;
    for (let c = 0; c < 3; c++) {
      let col = column + c;
      const cell = sheet.getCell(row, col);
      cell.value = "";
      if (data.length > r) {
        cell.value = data[r][c];
      }
    }
  }
  await sheet.saveUpdatedCells();
};

const updateMemberDataCells = async (sheet, data) => {
  await sheet.loadCells();
  const temp = [...data];
  temp.sort((a, b) => {
    if (a[0] == b[0]) return 0;
    else return a[0] < b[0] ? -1 : 1;
  });
  for (let r = 0; r < 100; r++) {
    let row = r + 1;
    for (let col = 0; col < 2; col++) {
      const cell = sheet.getCell(row, col);
      cell.value = "";
      if (temp.length > r) {
        cell.value = temp[r][col];
      }
    }
  }

  await sheet.saveUpdatedCells();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track-rebels")
    .setDescription("Track rebel leaders."),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const { TRACK_REBELS } = await getConfigs();
    const rebelsList = getRebelsCSV_FTP(path);
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
    const rebelData = parseRebelsList(rebelsList);
    const sheet = await initializeSheet();
    const weeklyData = sheet.sheetsByTitle[TRACK_REBELS.REBEL_DATA];
    const memberData = sheet.sheetsByTitle[TRACK_REBELS.MEMBER_DATA];
    const secondRow = await weeklyData.getRows({ offset: 0, limit: 1 });
    const rangeStart = secondRow[0]._rawData.length - TRACK_REBELS.WEEK_RANGE;

    rebelData.shift();
    await updateWeeklyContributionCells(weeklyData, rangeStart, rebelData);
    await updateMemberDataCells(memberData, rebelData);
    await interaction.editReply({
      content: INTERACTION_MESSAGE.END_PROCESS,
    });
  },
};
