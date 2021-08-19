const Interaction = require("../utils/interaction");
const { embed } = require("../utils/discord");
const { QUEUE } = require("../utils/constant");

module.exports = class Queue {
  constructor(interaction) {
    this.action = new Interaction(interaction);
    this.queueChannel = "title-queue";
    this.requestChannel = "buff-requests";
    this.officerRole = "Protocol Officer";
    this.header = "K65 TITLE BUFF QUEUE";
    this.EMPTY = "[EMPTY]";
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
    return contents.first().embeds[0].fields;
  }

  /**
   * Get officer role
   *
   * @returns {string}
   */
  async getOfficerRole() {
    return await this.action.getRoleTag(this.officerRole);
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
      if (this.checkPlayerInQueue(title.value, username)) {
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
      if (this.checkPlayerInQueue(title.value, username)) {
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
   * @param {string} title
   * @param {string} username
   * @returns {boolean} If player is found, return true else false
   */
  checkPlayerInQueue(title, username) {
    if (Array.isArray(title) && title.includes(username)) return true;
    return false;
  }

  /**
   * Check if there are officers online,
   * checks count of players that has officer role
   *
   * @returns {boolean}
   */
  isOfficerOnline() {
    const officers = this.action.findUsersWithRole(this.officerRole);
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
      title.value = title.value.split("\n");
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
};
