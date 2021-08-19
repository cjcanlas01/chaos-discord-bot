const Keyv = require("keyv");
const { DATABASE_URL } = require("../config");
module.exports = new Keyv(DATABASE_URL);
