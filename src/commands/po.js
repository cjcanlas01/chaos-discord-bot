const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const { post, postSelf } = require("../utils/utils");

const processProtocolOfficer = async (callback) => {
  return callback();
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("po")
    .setDescription("Protocol officer commands.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Protocol officer command options.")
        .setRequired(true)
        .addChoices([
          ["start", "start"],
          ["stop", "stop"],
          ["replace", "replace"],
        ])
    ),
  async execute(interaction) {
    const action = new Interaction(interaction);
    const queue = new Queue(interaction);
    const isOfficerOnline = await queue.isOfficerOnline();
    const userHasAccess = queue.checkUserHasPoAccess();
    const options = action.getOptions().getString("options");
    const isBuffRequestsChannel = await queue.checkIfBuffRequestsChannel();
    const {
      NO_ACCESS_ROLE,
      OFFICER_IN_SESSION,
      NO_OFFICER_IN_SESSION,
      INACTIVE_OFFICER_IN_SESSION,
      SAME_OFFICER_IN_SESSION,
      START_PO,
      STOP_PO,
      CURRENT_OFFICER_REPLACED,
    } = {
      ...queue.MESSAGES,
    };

    if (!isBuffRequestsChannel) {
      postSelf(interaction, "Warning! Cannot execute command here.");
      return;
    }

    if (!userHasAccess) {
      postSelf(interaction, NO_ACCESS_ROLE);
      return;
    }

    switch (options) {
      case "start":
        const startMessage = isOfficerOnline
          ? OFFICER_IN_SESSION
          : await processProtocolOfficer(() => {
              queue.addProtocolOfficerRole();
              return START_PO;
            });
        post(interaction, startMessage);
        break;
      case "stop":
        if (isOfficerOnline) {
          const stopMessage =
            (await queue.checkCurrentOfficerIsSameAsRequestingOfficer())
              ? await processProtocolOfficer(() => {
                  queue.removeProtocolOfficerRole();
                  return STOP_PO;
                })
              : INACTIVE_OFFICER_IN_SESSION;
          post(interaction, stopMessage);
          return;
        }
        postSelf(interaction, NO_OFFICER_IN_SESSION);
        break;
      case "replace":
        if (isOfficerOnline) {
          const replaceMessage =
            !(await queue.checkCurrentOfficerIsSameAsRequestingOfficer())
              ? await processProtocolOfficer(() => {
                  queue.replaceProtocolOfficer();
                  return CURRENT_OFFICER_REPLACED(action.getUser().this());
                })
              : SAME_OFFICER_IN_SESSION;
          post(interaction, replaceMessage);
          return;
        }
        postSelf(interaction, NO_OFFICER_IN_SESSION);
        break;
    }
  },
};
