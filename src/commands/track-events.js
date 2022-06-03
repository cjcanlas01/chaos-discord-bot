const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Papa = require("papaparse");
const path = require("path");
const { initializeSheet } = require("../utils/google-spreadsheet");
const { getConfigs } = require("../config");
const { checkIfUserIsAllowed } = require("../utils/utils");
const { getFilesFromDirectoryFTP } = require("../utils/ftp");
const { FTP_HOST } = require("../env-config");
const keyv = require("../utils/keyv");
const fs = require("fs");
const { listenerCount } = require("process");

// append <event type>/
const EVENT_DIR_LOCAL = path.resolve(__dirname, "../../events/");
const EVENT_DIR_REMOTE = `/${FTP_HOST}/events/`;
const AC = "AC";
const SOW = "SOW";

const getFilesForEvent = (eventName) => {
    let localDir = EVENT_DIR_LOCAL + eventName + "/";
    let remoteDir = EVENT_DIR_REMOTE + eventName + "/";

    getFilesFromDirectoryFTP(remoteDir, localDir);

    fs.readdir(localDir, async (err, filenames) => {
        if (err) {
            return;
        }
        let files = []
        filenames.forEach(filename => {
            files.push({
                name: filename,
                start: parseInt(filename.split('.')[0].split('-')[0]),
                end: parseInt(filename.split('.')[0].split('-')[1]),
                alliance: filename.split('.')[0].split('-')[2],
                type: filename.split('.')[0].split('-')[3],
                ranking: JSON.parse(fs.readFileSync(dirname + filename, "utf8"))
            });
        })
        return files;
    })
}

const mergeFilesForEvent = (eventName) => {
    let files = getFilesForEvent(eventName);
    let mergedFiles = {}
    files.forEach(file => {
        if (!(file.alliance in mergedFiles)) {
            mergedFiles[file.alliance] = {};
        }
        if (!(file.start in mergedFiles[file.alliance])) {
            mergedFiles[file.alliance][file.start] = {
                start: file.start,
                end: file.end,
                ranking: file.ranking
            };
        }
        else {
            let mr = mergeRankings(mergedFiles[file.alliance][file.start].ranking, file.ranking);
            mergedFiles[file.alliance][file.start].ranking = mr;
        }
    });
    return mergedFiles;
}

const mergeRankings = (ranking1, ranking2) => {
    let mergedRankings = []
    ranking1.forEach(rank1 => {
        let rank2 = ranking2.find(r => r.id === rank1.id);
        if (rank2 != undefined) {
            mergedRankings.push({
                name: rank1.name,
                id: rank1.id,
                alliance: rank1.alliance,
                kill: Math.max(rank1.kill, rank2.kill),
                heal: Math.max(rank1.heal, rank2.heal)
            });
        }
    });
    return mergedRankings;
}


module.exports = {
    data: new SlashCommandBuilder()
        .setName("track-events")
        .setDescription("Track events performance."),
    async execute(interaction) {
        console.log(Date.now(), "Start function call");
        await interaction.deferReply();
        const action = new Interaction(interaction);
        const isUserAllowed = await checkIfUserIsAllowed(action);
        if (!isUserAllowed) {
            await interaction.editReply({
              content: "Warning! You have no permission for this command.",
              ephemeral: true,
            });
            return;
        }

        let sowFiles = mergeFilesForEvent(SOW);
        console.log(sowFiles);

    },
};
  