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
  return new Promise((resolve, reject) => {
    ftp.on("ready", () => {
      ftp.get(remoteFile, async (err, stream) => {
        if (err) return;
        stream.once("close", () => {ftp.end(); resolve()});
        stream.pipe(fs.createWriteStream(localFilePath));
      });
    });
  
    ftp.connect({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
    });
  })
};


/**
 * @param {string} remoteDir
 * @param {string} localDirPath
 */
const getFilesFromDirectoryFTP = async (remoteDir, localDirPath) => {
  return new Promise((resolve, reject) => {
    ftp.on("ready", () => {
      ftp.list(remoteDir, async (err, files) => {
        if (err) {
          reject(err);
        }
        let filesDownloaded = files.map(f => {
          return new Promise((resolve, reject) => {
            ftp.get(remoteDir + f.name, (err, stream) => {
              if (err) {
                reject(err);
              }
              stream.once("close", () => {ftp.end(); resolve();});
              stream.pipe(fs.createWriteStream(localDirPath + f.name, "utf-8"));
            });
          });
        });
        await Promise.all(filesDownloaded);
        resolve();
      });
    });
  
    ftp.connect({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
    });
  });
}

/**
 * @param {string} remoteFile
 * @param {string} localFilePath
 * @returns {object}
 */
const getFileIfExists = async (remoteFile, localFilePath) => {
  await getFileFromFTP(remoteFile, localFilePath);
  try {
    await fs.promises.stat(localFilePath);
    return {
      exists: true,
      file: fs.readFileSync(localFilePath, "utf8"),
    };
  } catch(err) {
    return {
      exists: false,
    }
  }
}

module.exports = {
  getFileFromFTP,
  getFileIfExists,
  getFilesFromDirectoryFTP,
};
