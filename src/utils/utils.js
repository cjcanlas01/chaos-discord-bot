/**
 * Generate options for slash commands
 *
 * @param {object} collection
 * @param {callback} callback
 * @returns {object}
 */
const generateOptions = (collection, callback) => {
  const commands = [];
  for (const [key, value] of Object.entries(collection)) {
    commands.push(callback(key, value));
  }
  return commands;
};

module.exports = {
  generateOptions,
};
