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
 * Get config content based on whether file exists inside project
 *
 * @returns {object}
 */
const getConfig = async () => {
  if (checkIfConfigFileExists()) {
    const gist = await axios.get(gistUrl(GIST_ID), {
      headers: {
        Authorization: `Bearer ${GITHUB_PERSONAL_TOKEN}`,
      },
    });
    const parsedConfig = JSON.parse(gist.data.files[GIST_FILENAME].content);
    return {
      source: "remote",
      config: parsedConfig,
    };
  }

  return {
    source: "local",
    config: require("../config.json"),
  };
};

module.exports = {
  checkIfConfigFileExists,
  getConfig,
};
