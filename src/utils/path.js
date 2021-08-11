const path = require("path");

/**
 * Generate path with root directory
 *
 * @param {string} dir
 * @returns {string}
 */
const generatePath = (dir) => path.resolve(__dirname, dir);

module.exports = {
  generatePath,
};
