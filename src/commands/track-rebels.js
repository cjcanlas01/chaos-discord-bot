const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Papa = require("papaparse");
const path = require("path");
const { initializeSheet } = require("../utils/google-spreadsheet");
const { getConfigs } = require("../config");
const { checkIfUserIsAllowed } = require("../utils/utils");
const { getFileIfExists } = require("../utils/ftp");
const { FTP_HOST } = require("../env-config");
const keyv = require("../utils/keyv");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { GoogleSpreadsheetWorksheet } = require("google-spreadsheet");

const REBELS_CSV_PATH = path.resolve(__dirname, "../../rebels.csv");
const REBELS_CSV_FILE = `/${FTP_HOST}/rebels.csv`;
const INTERACTION_MESSAGE = {
  START_PROCESS: "I'm working on it! Please wait...",
  END_PROCESS: "Rebels list updated!",
};

/**
 * Remove colon (;) and empty string ("") from csv
 * @param {string} csv
 * @returns {array}
 */
const parseRebelsList = (csv) => {
  const { data } = Papa.parse(csv, { skipEmptyLines: true });
  return data.map((rows) => {
    return rows
      .filter((row) => row.length > 0)
      .map((row) => row.replace(";", ""));
  });
};

/**
 * @param {object} sheet
 * @param {integer} column
 * @param {array} data
 */
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

/**
 * @param {GoogleSpreadsheetWorksheet} sheet
 * @param {array} data
 */
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

/**
 * @param {object} sheet
 * @returns {integer}
 */
const getRangeStart = async (sheet) => {
  await sheet.loadCells({ startRowIndex: 1 });
  for (let i = 0; i < 18278; i++) {
    const val = await sheet.getCell(1, i).value;
    if (String(val) == "null") {
      return i;
    }
  }
};

/**
 * @param {array} fileContents
 * @returns {boolean}
 */
const identifyFileContents = async (fileContents) => {
  const key = "REBEL_CSV_CONTENT",
    content = await keyv.get(key);
  if (content == undefined) {
    await keyv.set(key, fileContents);
  } else {
    // Check if file content is same or old than the current one
    const newContent = JSON.stringify(fileContents);
    if (content.trim() === newContent.trim()) {
      return false;
    }
    await keyv.set(key, newContent);
    return true;
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track-rebels")
    .setDescription("Track rebel leaders."),
  async execute(interaction) {
    await interaction.deferReply();
    const action = new Interaction(interaction);
    const { TRACK_REBELS } = await getConfigs();
    const rebelsList = await getFileIfExists(REBELS_CSV_FILE, REBELS_CSV_PATH);
    const isUserAllowed = await checkIfUserIsAllowed(action);

    if (!isUserAllowed) {
      await interaction.editReply({
        content: "Warning! You have no permission for this command.",
        ephemeral: true,
      });
      return;
    }

    if (!rebelsList.exists) {
      await interaction.editReply("Rebels list is not found!");
      return;
    }

    if (!(await identifyFileContents(rebelsList.file))) {
      await interaction.editReply(
        "Rebels list source is not updated! Please upload an updated one."
      );
      return;
    }

    await interaction.editReply(INTERACTION_MESSAGE.START_PROCESS);
    const rebelData = parseRebelsList(rebelsList.file);
    const sheet = await initializeSheet();
    const { REBEL_DATA, MEMBER_DATA, WEEK_RANGE } = TRACK_REBELS;
    // Get sheets by title
    const weeklyData = sheet.sheetsByTitle[REBEL_DATA];
    const memberData = sheet.sheetsByTitle[MEMBER_DATA];
    // Get range for weekly data sheet
    const rangeStart = (await getRangeStart(weeklyData)) - WEEK_RANGE;
    // Remove header from csv source as existing already in GoogleSpreadsheet
    rebelData.shift();
    await updateWeeklyContributionCells(weeklyData, rangeStart, rebelData);
    await updateMemberDataCells(memberData, rebelData);
    await interaction.editReply({
      content: INTERACTION_MESSAGE.END_PROCESS,
    });
  },
};
