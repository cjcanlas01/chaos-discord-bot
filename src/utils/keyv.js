const Keyv = require("keyv");
const { DATABASE_URL } = require("../env-config");
module.exports = new Keyv(DATABASE_URL);
