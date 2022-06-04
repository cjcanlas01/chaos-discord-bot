const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const path = require("path");
const { initializeSheet } = require("../utils/google-spreadsheet");
const { getConfigs } = require("../config");
const { checkIfUserIsAllowed } = require("../utils/utils");
const { getFilesFromDirectoryFTP } = require("../utils/ftp");
const { FTP_HOST } = require("../env-config");
const fs = require("fs");
const LosslessJSON = require("lossless-json");

// append <event type>
const EVENT_DIR_LOCAL = path.resolve(__dirname, "../../data/") + "/";
const EVENT_DIR_REMOTE = `/${FTP_HOST}/events/`;
const INTERACTION_MESSAGE = {
  START_PROCESS: "I'm working on it! Please wait...",
  END_PROCESS: "Event participation updated!",
};

const getFilesForEvent = async (eventName) => {
  let localDir = EVENT_DIR_LOCAL + eventName + "/";
  let remoteDir = EVENT_DIR_REMOTE + eventName + "/";

  await getFilesFromDirectoryFTP(remoteDir, localDir);

  let filenames = await fs.promises.readdir(localDir);
  return filenames
    .filter((file) => file != ".gitignore")
    .map((filename) => ({
      name: filename,
      start: parseInt(filename.split(".")[0].split("-")[0]),
      end: parseInt(filename.split(".")[0].split("-")[1]),
      alliance: filename.split(".")[0].split("-")[2],
      type: filename.split(".")[0].split("-")[3],
      ranking: LosslessJSON.parse(
        fs.readFileSync(localDir + filename, "utf-8").slice(1)
      ),
    }));
};

const mergeFilesForEvent = async (eventName) => {
  let files = await getFilesForEvent(eventName);
  files.forEach((file) => {
    file.ranking.forEach((rank) => {
      rank.id = String(rank.id);
    });
  });
  let mergedFiles = {};
  files.forEach((file) => {
    if (!(file.alliance in mergedFiles)) {
      mergedFiles[file.alliance] = {};
    }
    if (!(file.start in mergedFiles[file.alliance])) {
      mergedFiles[file.alliance][file.start] = {
        start: file.start,
        end: file.end,
        ranking: file.ranking,
      };
    } else {
      let mr = mergeRankings(
        mergedFiles[file.alliance][file.start].ranking,
        file.ranking
      );
      mergedFiles[file.alliance][file.start].ranking = mr;
    }
  });
  return mergedFiles;
};

const mergeRankings = (ranking1, ranking2) => {
  let mergedRankings = [];
  ranking1.forEach((rank1) => {
    let rank2 = ranking2.find((r) => r.id === rank1.id);
    if (rank2 != undefined) {
      mergedRankings.push({
        name: rank1.name,
        id: rank1.id,
        alliance: rank1.alliance,
        kill: Math.max(rank1.kill, rank2.kill),
        heal: Math.max(rank1.heal, rank2.heal),
      });
    } else {
      mergedRankings.push({
        name: rank1.name,
        id: rank1.id,
        alliance: rank1.alliance,
        kill: rank1.kill,
        heal: rank1.heal,
      });
    }
  });
  ranking2.forEach((rank2) => {
    let rank1 = ranking1.find((r) => r.id === rank2.id);
    if (rank1 === undefined) {
      mergedRankings.push({
        name: rank2.name,
        id: rank2.id,
        alliance: rank2.alliance,
        kill: rank2.kill,
        heal: rank2.heal,
      });
    }
  });
  mergedRankings.sort((r1, r2) => r2.kill - r1.kill);
  return mergedRankings;
};

/**
 *
 * @param {string} eventName
 * @param {GoogleSpreadsheet} sheet
 */
const fillDataForEvent = async (eventName, sheet) => {
  const eventLogColumnSpan = 5;
  let files = await mergeFilesForEvent(eventName);
  let round = 0;
  for (let [alliance, matches] of Object.entries(files)) {
    if (alliance !== "MAD") continue; // for now skip non-mad
    for (let [date, logs] of Object.entries(matches)) {
      let d = new Date(logs.start * 1000);
      let dateString = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

      const eventSheet = sheet.sheetsByTitle[eventName];

      await eventSheet.loadCells();
      let col = round * eventLogColumnSpan;
      eventSheet.getCell(1, col).value = dateString;
      for (let r = 0; r < 100; r++) {
        let row = r + 3;
        const id = eventSheet.getCell(row, col);
        const name = eventSheet.getCell(row, col + 1);
        const kill = eventSheet.getCell(row, col + 2);
        const heal = eventSheet.getCell(row, col + 3);
        const hasData = logs.ranking.length > r;
        id.value = hasData ? String(logs.ranking[r].id) : null;
        name.value = hasData ? logs.ranking[r].name : null;
        kill.value = hasData ? parseInt(logs.ranking[r].kill) : null;
        heal.value = hasData ? parseInt(logs.ranking[r].heal) : null;
      }
      await eventSheet.saveUpdatedCells();
      round++;
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track-events")
    .setDescription("Track events performance."),
  async execute(interaction) {
    console.log(Date.now(), "Start function call");
    await interaction.deferReply();
    const action = new Interaction(interaction);
    const { TRACK_EVENTS } = await getConfigs();
    const isUserAllowed = await checkIfUserIsAllowed(action);
    if (!isUserAllowed) {
      await interaction.editReply({
        content: "Warning! You have no permission for this command.",
        ephemeral: true,
      });
      return;
    }

    const sheet = await initializeSheet();
    await interaction.editReply(INTERACTION_MESSAGE.START_PROCESS);
    await fillDataForEvent(TRACK_EVENTS.SOW_DATA, sheet);
    await fillDataForEvent(TRACK_EVENTS.AC_DATA, sheet);
    await interaction.editReply({
      content: INTERACTION_MESSAGE.END_PROCESS,
    });
  },
};
