module.exports = class Interaction {
  constructor(interaction) {
    this.final = [];
    this.reset = interaction;
    this.instance = interaction;
  }

  /**
   * Get Client object
   * - The main hub for interacting with the Discord API, and the starting point for any bot
   * - Reference: https://discord.js.org/#/docs/main/stable/class/Client
   * @returns {Interaction}
   */
  getClient() {
    this.instance = this.instance.client;
    return this;
  }

  /**
   * Get GuildMember object
   * - Represents a member of a guild on Discord
   * - Reference: https://discord.js.org/#/docs/main/stable/class/GuildMember
   *
   * @returns {Interaction}
   */
  getGuildMember() {
    this.instance = this.instance.member;
    return this;
  }

  /**
   * Get Guild object
   * - Represents a guild (or a server) on Discord. It's recommended to see if a guild is available before performing operations or reading data from it
   * - Reference: https://discord.js.org/#/docs/main/stable/class/Guild
   *
   * @returns {Interaction}
   */
  getGuild() {
    this.instance = this.instance.member.guild;
    return this;
  }

  /**
   * Get GuildMemberRoleManager object
   * - Manages API methods for roles of a GuildMember and stores their cache
   * - Reference: https://discord.js.org/#/docs/main/stable/class/GuildMemberRoleManager
   *
   * @returns {Interaction}
   */
  getGuildMemberRoleManager() {
    this.instance = this.instance.member.roles;
    return this;
  }

  /**
   * Get GuildMemberManager object
   * - Manages API methods for GuildMembers and stores their cache
   * - Reference: https://discord.js.org/#/docs/main/stable/class/GuildMemberManager
   *
   * @returns {Interaction}
   */
  getGuildMemberManager() {
    this.instance = this.instance.member.guild.members;
    return this;
  }

  /**
   * Get GuildChannelManager object
   * - Manages API methods for GuildChannels and stores their cache
   * - Reference: https://discord.js.org/#/docs/main/stable/class/GuildChannelManager
   *
   * @returns {Interaction}
   */
  getGuildChannelManager() {
    this.instance = this.instance.member.guild.channels;
    return this;
  }

  /**
   * Get User object
   * - Represents a user on Discord
   * - Reference: https://discord.js.org/#/docs/main/stable/class/User
   *
   * @returns {Interaction}
   */
  getUser() {
    this.instance = this.instance.member.user;
    return this;
  }

  /**
   * Get current channel of where the interaction was executed
   *
   * @returns {TextChannel}
   */
  async getCurrentChannel() {
    const channelId = this.instance.channelId;
    const channel = await this.getGuildChannelManager().this().fetch(channelId);
    this.#reset(async () => channel);
    return this.final;
  }

  /**
   * Get RoleManager object
   * - Manages API methods for roles and stores their cache
   * - Reference: https://discord.js.org/#/docs/main/stable/class/RoleManager
   *
   * @returns {Interaction}
   */
  getRoleManager() {
    this.instance = this.instance.member.guild.roles;
    return this;
  }

  /**
   * Get taggable Discord role
   *
   * @param {string} role
   * @returns {string}
   */
  getRoleTag(role) {
    this.#reset(() => this.getRoleManager().#find("name", role).toString());
    return this.final;
  }

  /**
   * Get role ID
   *
   * @param {string} role
   * @returns {string}
   */
  getRoleId(role) {
    this.#reset(() => this.getRoleManager().#find("name", role).id);
    return this.final;
  }

  /**
   * Get guild ID
   *
   * @returns {string}
   */
  getGuildId() {
    this.#reset(() => this.instance.guildId);
    return this.final;
  }

  /**
   * Get CommandInteractionOptionResolver object
   * - A resolver for command interaction options
   * - Reference: https://discord.js.org/#/docs/main/stable/class/CommandInteractionOptionResolver
   *
   * @returns {Interaction}
   */
  getOptions() {
    this.#reset(() => this.instance.options);
    return this.final;
  }

  /**
   * Get bot client commands
   *
   * @returns {object}
   */
  getClientCommands() {
    this.#reset(() => this.instance.client.commands);
    return this.final;
  }

  /**
   * Get bot's config collection
   *
   * @returns {object}
   */
  getBotConfigs() {
    const config = this.instance.client.configs;
    this.#reset(() =>
      Array.from(config).reduce((acc, cur) => {
        return {
          ...acc,
          [cur[0]]: cur[1],
        };
      }, {})
    );
    return this.final;
  }

  /**
   * Find all users with specified role
   *
   * @param {string} role
   * @returns {object}
   */
  async findUsersWithRole(role) {
    const memberManager = await this.getGuildMemberManager().this().fetch();
    this.#reset(() => {
      return memberManager.filter((member) => {
        return member.roles.cache.has(this.getRoleId(role));
      });
    });
    return this.final;
  }

  /**
   * Find object by name
   *
   * @param {string} name
   * @returns {object}
   */
  findByName(name) {
    this.#reset(() => this.#find("name", name));
    return this.final;
  }

  /**
   * Find value by property
   *
   * @param {string} property
   * @returns {object}
   */
  findByProperty(property) {
    this.#reset(() => this.#find(property));
    return this.final;
  }

  /**
   * Get available username,
   * check if interaction has user option
   * else get nickname from interaction object
   *
   * @returns {string}
   */
  async availableUserName(taggedUser = false) {
    let instance;
    let identifiedUser;

    if (!taggedUser) {
      identifiedUser = !this.getOptions()
        ? false
        : this.getOptions().getUser("user");
    } else {
      identifiedUser = taggedUser;
    }

    if (!identifiedUser) {
      instance = this.getGuildMember().this();
    } else {
      instance = await this.getGuildMemberManager().this().fetch(taggedUser);
    }

    this.#reset(() => {
      return !instance.nickname ? instance.user.username : instance.nickname;
    });
    return this.final;
  }

  /**
   * Returns object of current instance
   *
   * @returns {object}
   */
  this() {
    this.#reset(() => this.instance);
    return this.final;
  }

  // Starting from this line, all methods are utilities

  /**
   * Find value by property or
   * object by value in cache
   *
   * @param {string} property
   * @param {any} value
   * @returns {object}
   */
  #find(property, value = null) {
    if (!value) {
      return this.instance[property];
    }
    return this.instance.cache.find((ch) => ch[property] == value);
  }

  /**
   * Reset method chain of class instance
   *
   * @param {function} callback
   */
  #reset(callback) {
    this.final = callback();
    this.instance = this.reset;
  }
};
