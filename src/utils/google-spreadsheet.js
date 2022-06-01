const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  GOOGLE_SPREADSHEET_URL,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
} = require("../env-config");

const initializeSheet = async () => {
  const doc = new GoogleSpreadsheet(GOOGLE_SPREADSHEET_URL);
  await doc.useServiceAccountAuth({
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY,
  });
  await doc.loadInfo();
  return doc;
};

module.exports = {
  initializeSheet,
};
