const { SlashCommandBuilder } = require("@discordjs/builders");
const Interaction = require("../utils/interaction");
const Queue = require("../utils/queue");
const { post, postSelf } = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("po")
    .setDescription("Protocol Officer commands.")
    .addStringOption((option) =>
      option
        .setName("options")
        .setDescription("Protocol Officer command options.")
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

    if (!userHasAccess) {
      postSelf(interaction, NO_ACCESS_ROLE);
      return;
    }

    switch (options) {
      case "start":
        if (isOfficerOnline) {
          postSelf(interaction, OFFICER_IN_SESSION);
          return;
        }
        await queue.addProtocolOfficerRole();
        post(interaction, START_PO);
        break;
      case "stop":
        if (isOfficerOnline) {
          const isSameUser =
            await queue.checkCurrentOfficerIsSameAsRequestingOfficer();
          if (isSameUser) {
            await queue.removeProtocolOfficerRole();
            post(interaction, STOP_PO);
          } else {
            postSelf(interaction, INACTIVE_OFFICER_IN_SESSION);
          }
        } else {
          postSelf(interaction, NO_OFFICER_IN_SESSION);
        }
        break;
      case "replace":
        if (isOfficerOnline) {
          const isSameUser =
            await queue.checkCurrentOfficerIsSameAsRequestingOfficer();
          if (!isSameUser) {
            await queue.replaceProtocolOfficer();
            post(
              interaction,
              CURRENT_OFFICER_REPLACED(action.getUser().this())
            );
          } else {
            postSelf(interaction, SAME_OFFICER_IN_SESSION);
          }
        } else {
          postSelf(interaction, NO_OFFICER_IN_SESSION);
        }
        break;
    }
  },
};
