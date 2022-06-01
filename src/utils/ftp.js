const fs = require("fs");
const FTP = require("ftp");
const { FTP_HOST, FTP_USER, FTP_PASSWORD } = require("../env-config");
const ftp = new FTP();

const DELAY = 2500;

/**
 * @param {string} remoteFile
 * @param {string} localFilePath
 */
const getFileFromFTP = (remoteFile, localFilePath) => {
  ftp.connect({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASSWORD,
  });

  ftp.on("ready", () => {
    ftp.get(remoteFile, async (err, stream) => {
      if (err) return;
      stream.once("close", () => ftp.end());
      stream.pipe(fs.createWriteStream(localFilePath));
    });
  });
};

/**
 * @param {string} remoteFile
 * @param {string} localFilePath
 * @returns {object}
 */
const getFileIfExists = (remoteFile, localFilePath) => {
  return new Promise((resolve, reject) => {
    getFileFromFTP(remoteFile, localFilePath);
    setTimeout(() => {
      fs.stat(localFilePath, (err, stat) => {
        if (err != null) {
          resolve({
            exists: false,
          });
        } else {
          resolve({
            exists: true,
            file: fs.readFileSync(localFilePath, "utf8"),
          });
        }
      });
    }, DELAY);
  });
};

module.exports = {
  getFileFromFTP,
  getFileIfExists,
};
