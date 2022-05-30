const fs = require("fs");
const FTP = require("ftp");
const { FTP_HOST, FTP_USER, FTP_PASSWORD } = require("../env-config");
const ftp = new FTP();

const getFile = (remoteFile, localFilePath) => {
  return new Promise((resolve, reject) => {
    ftp.connect({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
    });

    ftp.on("ready", () => {
      ftp.get(remoteFile, (err, stream) => {
        if (err) return reject(err);
        stream.once("close", () => ftp.end());
        stream.pipe(fs.createWriteStream(localFilePath));
        return resolve(fs.readFileSync(localFilePath, "utf8"));
      });
    });
  });
};

module.exports = {
  getFile,
};
