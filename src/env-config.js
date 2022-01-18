require("dotenv").config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  DATABASE_URL: process.env.DATABASE_URL,
  GIST_ID: process.env.GIST_ID,
  GIST_FILENAME: process.env.GIST_FILENAME,
  GITHUB_PERSONAL_TOKEN: process.env.GITHUB_PERSONAL_TOKEN,
};
