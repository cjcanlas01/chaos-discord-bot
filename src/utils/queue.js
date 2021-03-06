const Interaction = require("../utils/interaction");
const { embed } = require("../utils/discord");
const { QUEUE } = require("../utils/constant");
const { Permissions } = require("discord.js");

const MESSAGES = {
  NO_ACCESS_ROLE: "You do not have access for Protocol Officer.",
  OFFICER_IN_SESSION: "There is a Protocol Officer in session.",
  NO_OFFICER_IN_SESSION: "There is no Protocol officer in session.",
  START_PO:
    "NOW! A new Protocol Officer is here to give buffs. Thank you for your time generous PO!",
  STOP_PO:
    "The Protocol Officer is leaving, the buffs will not be available until another one take the role. Thank you!",
  INACTIVE_OFFICER_IN_SESSION:
    "There is a Protocol officer in session, if he/ she may seem inactive, execute `/po options: replace` to get the role. Thank you !",
  CURRENT_OFFICER_REPLACED: (username) =>
    `NOW! The Protocol officer has been replaced. New Protocol officer is ${username.toString()}.`,
  SAME_OFFICER_IN_SESSION:
    "You shall not pass! Use `/po options: stop` instead.",
  PLAYER_IN_QUEUE: (username) => `\`${username}\` is already in a queue.`,
  PLAYER_REMOVED_IN_QUEUE: (username) =>
    `\`${username}\` is removed from the queue.`,
  PLAYER_NOT_IN_QUEUE: (username) => `\`${username}\` is not in a queue.`,
  PVP_TITLES_NOT_AVAILABLE: "PVP titles are not available.",
  CANNOT_SEND_MESSAGE:
    "I cannot send message to queue channel. One of my roles is restricting me! Help!",
  PVP_TITLES_ONLY_AVAILABLE: "Only PVP titles are available as of this moment.",
};

module.exports = class Queue {
  constructor(interaction) {
    this.action = new Interaction(interaction);
    const {
      QUEUE_CHANNEL,
      BUFF_CHANNEL,
      PO_ROLE,
      PO_ACCESS_ROLE,
      BUFF_QUEUE_HEADER,
    } = this.action.getBotConfigs();
    this.queueChannel = QUEUE_CHANNEL;
    this.requestChannel = BUFF_CHANNEL;
    this.officerRole = PO_ROLE;
    this.officerAccessRole = PO_ACCESS_ROLE;
    this.header = BUFF_QUEUE_HEADER;
    this.acCommand = "ac";
    this.mode = {
      ADD: "add",
      DONE: "done",
    };
    this.EMPTY = "[EMPTY]";
    this.MESSAGES = MESSAGES;
  }

  /**
   * Get queue channel
   *
   * @returns {object}
   */
  getChannel() {
    return this.action.getGuildChannelManager().findByName(this.queueChannel);
  }

  /**
   * Delete last 100 message of
   * specified channel
   *
   * @param {TextChannel} channel
   */
  async emptyChannel(channel) {
    await channel.bulkDelete(100);
  }

  /**
   * Get queue as object from
   * queue channel
   *
   * @returns {object}
   */
  async getQueue() {
    const channel = this.getChannel();
    const contents = await channel.messages.fetch();
    const message = contents.first();

    if (message != undefined && message.embeds.length != 0) {
      return message.embeds[0].fields;
    }

    return QUEUE;
  }

  /**
   * Get taggable officer role
   *
   * @returns {string}
   */
  async getTaggableOfficerRole() {
    return await this.action.getRoleTag(this.officerRole);
  }

  /**
   * Get officer role ID
   *
   * @returns {string}
   */
  async getOfficerRoleId() {
    return await this.action.getRoleId(this.officerRole);
  }

  /**
   * Empty queue channel
   * and display new queue
   */
  async resetQueue() {
    const channel = this.getChannel();
    await this.emptyChannel(channel);
    channel.send({
      embeds: [embed(QUEUE, this.header)],
    });
  }

  /**
   * Add player in queue under selected title
   *
   * @param {string} selectedTitle
   * @param {string} username
   * @returns {boolean} If player is found, return false else true
   */
  async addPlayerInQueue(selectedTitle, username) {
    const queue = await this.getQueue();
    const parsedQueue = this.splitTitles(queue);
    for (let title of parsedQueue) {
      if (this.checkPlayerInQueue(parsedQueue, username, this.mode.ADD)) {
        return false;
      }
      if (title.name == selectedTitle) {
        if (title.value.includes(this.EMPTY)) {
          title.value = title.value.filter((names) => names != this.EMPTY);
        }

        title.value.push(username);
        break;
      }
    }
    this.displayQueue(this.combineTitles(parsedQueue));
    return true;
  }

  /**
   * Find and remove player in queue
   *
   * @param {string} username
   * @returns {boolean} If player is found, remove then return true else false
   */
  async removePlayerInQueue(username) {
    const queue = await this.getQueue();
    const parsedQueue = this.splitTitles(queue);
    let userFound;
    for (let title of parsedQueue) {
      if (this.checkPlayerInQueue(title.value, username, this.mode.DONE)) {
        title.value = title.value.filter((name) => name != username);
        if (title.value.length <= 0) {
          title.value.push(this.EMPTY);
        }
        userFound = true;
        break;
      }
    }
    if (userFound) {
      this.displayQueue(this.combineTitles(parsedQueue));
    } else {
      userFound = false;
    }
    return userFound;
  }

  /**
   * Check if player name is included in list under selected title
   *
   * @param {object | array} queue
   * @param {string} username
   * @param {string} mode
   * @returns {boolean} If player is found, return true else false
   */
  checkPlayerInQueue(queue, username, mode) {
    if (Array.isArray(queue)) {
      if (mode == this.mode.DONE) {
        if (queue.includes(username)) return true;
      }

      if (mode == this.mode.ADD) {
        const checkUserOnEveryQueue = queue.some((title) =>
          title.value.includes(username)
        );
        if (checkUserOnEveryQueue) return true;
      }
    }

    return false;
  }

  /**
   * Check if there are officers online,
   * checks count of players that has officer role
   *
   * @returns {boolean}
   */
  async isOfficerOnline() {
    const officers = await this.action.findUsersWithRole(this.officerRole);
    if (officers.size <= 0) return false;
    return true;
  }

  /**
   * Check if user executing command has officer role
   *
   * @returns {boolean}
   */
  checkUserIsOfficer() {
    const hasRole = this.action
      .getGuildMemberRoleManager()
      .findByName(this.officerRole);
    if (typeof hasRole == "object") {
      return true;
    }
    return false;
  }

  /**
   * Check if the channel that the interaction came from is request channel
   *
   * @returns {boolean}
   */
  async checkIfBuffRequestsChannel() {
    const channel = await this.action.getCurrentChannel();
    if (channel.name == this.requestChannel) return true;
    return false;
  }

  /**
   * Display updated queue to queue channel
   *
   * @param {object} queue
   */
  async displayQueue(queue) {
    const channel = this.getChannel();
    await this.emptyChannel(channel);
    channel.send({
      embeds: [embed(queue, this.header)],
    });
  }

  /**
   * Parse all value property of embed,
   * separate by new line
   *
   * @param {object} queue
   * @returns {object}
   */
  splitTitles(queue) {
    return queue.map((title) => {
      title.value = title.value.split("\n").map((user) => user.trim());
      return title;
    });
  }

  /**
   * Parse all value property of embed,
   * combine with new line
   * @param {object} queue
   * @returns {object}
   */
  combineTitles(queue) {
    return queue.map((title) => {
      title.value = title.value.join("\n");
      return title;
    });
  }

  /**
   * Get buff mode id for keyv record
   *
   * @returns {string}
   */
  getBuffModeId() {
    return `${this.action.getGuildId()}_BUFF_MODE`;
  }

  /**
   * Check user executing command has access role
   *
   * @returns {boolean}
   */
  checkUserHasPoAccess() {
    const hasAccess = this.action
      .getGuildMemberRoleManager()
      .findByName(this.officerAccessRole);
    if (typeof hasAccess == "object") {
      return true;
    }
    return false;
  }

  /**
   * Get current protocol officer user object
   *
   * @returns {object}
   */
  async getProtocolOfficer() {
    const officer = await this.action.findUsersWithRole(this.officerRole);
    return officer.first();
  }

  /**
   * Get Protocol Officer role
   *
   * @returns {object}
   */
  getProtocolOfficerRole() {
    return this.action.getRoleManager().findByName(this.officerRole);
  }

  /**
   * Check if current officer is same as requesting officer
   *
   * @returns {boolean}
   */
  async checkCurrentOfficerIsSameAsRequestingOfficer() {
    const currentOfficer = await this.getProtocolOfficer();
    const replacingUser = this.action.getUser().this();
    const currentOfficerUserId = currentOfficer.user.id;
    const replacingUserId = replacingUser.id;
    if (currentOfficerUserId == replacingUserId) return true;
    return false;
  }

  /**
   * Add Protocol Officer to current executing user
   */
  async addProtocolOfficerRole() {
    const role = this.getProtocolOfficerRole();
    await this.action.getGuildMemberRoleManager().this().add(role);
  }

  /**
   * Remove Protocol Officer to current executing user
   */
  async removeProtocolOfficerRole() {
    const role = this.getProtocolOfficerRole();
    await this.action.getGuildMemberRoleManager().this().remove(role);
  }

  /**
   * Switch Protocol Officer from current officer to requesting officer
   */
  async replaceProtocolOfficer() {
    const officerRole = this.getProtocolOfficerRole();
    const currentOfficer = await this.getProtocolOfficer();
    const currentOfficerRoleManager = currentOfficer.roles;
    const replacingOfficerRoleManager = this.action
      .getGuildMember()
      .this().roles;
    await currentOfficerRoleManager.remove(officerRole);
    await replacingOfficerRoleManager.add(officerRole);
  }

  /**
   * Get requesting name based on input (castle name or discord tag)
   *
   * @returns {string}
   */
  async getRequestingName() {
    const optionsToFilter = ["farm_titles", "atk_titles"];
    const commandObject = this.action.getOptions().data;
    const [commandDetails] = commandObject;
    const { options } = commandDetails;
    const selectedOption =
      options != undefined &&
      options.filter((option) => !optionsToFilter.includes(option.name))[0];

    let identifiedOption;
    // If no discord_tag or castle_name selected
    if (options == undefined || selectedOption == undefined) {
      identifiedOption = "self";
    } else {
      identifiedOption = selectedOption.name;
    }

    switch (identifiedOption) {
      case "discord_tag":
        return this.action.availableUserName(selectedOption.user);
      case "castle_name":
        return selectedOption.value;
      case "self":
        return this.action.availableUserName();
    }
  }

  /**
   * Check if bot has permission to send message to queue channel
   *
   * @returns {boolean}
   */
  checkIfAbleToSendMessageToQueueChannel() {
    return this.getChannel()
      .permissionsFor(this.action.me())
      .has(Permissions.FLAGS.SEND_MESSAGES);
  }

  /**
   *  Check if guild has Alliance Conquest command
   *
   * @returns {boolean}
   */
  async checkIfAllianceConquesCommandtExists() {
    const guildCommands = await this.action.getGuildCommands().fetch();
    const guildCommandsName = guildCommands.map((command) => command.name);
    if (guildCommandsName.includes(this.acCommand)) return true;
    return false;
  }
};
