const { access } = require("fs/promises");
const { constants } = require("fs");
const axios = require("axios");
const {
  GIST_ID,
  GIST_FILENAME,
  GITHUB_PERSONAL_TOKEN,
} = require("./env-config");

/**
 * Get Github Gist URL
 *
 * @param {string} gistId
 * @returns {string}
 */
const gistUrl = (gistId) => `https://api.github.com/gists/${gistId}`;

/**
 * Check if local config file exists inside project
 *
 * @returns {boolean}
 */
const checkIfConfigFileExists = async () => {
  try {
    await access("./config.json", constants.R_OK | constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get config if exists inside project else get from Github Gist
 *
 * @returns {object}
 */
const getConfigs = async () => {
  const configFileExists = await checkIfConfigFileExists();
  if (!configFileExists) {
    const gist = await axios.get(gistUrl(GIST_ID), {
      headers: {
        Authorization: `Bearer ${GITHUB_PERSONAL_TOKEN}`,
      },
    });

    return JSON.parse(gist.data.files[GIST_FILENAME].content);
  }

  // Delete cache to get latest config content
  delete require.cache[require.resolve("../config.json")];
  return require("../config.json");
};

module.exports = {
  checkIfConfigFileExists,
  getConfigs,
};
