/*
  -----------------------------------------------------------

  This file is used to coordinate constants and functions
  implemented in various services.

  NOTE:
  It is CRUITIAL NOT TO UPDATE ANYTHING HERE UNLESS
  ABSOLUTELY NECESSARY. This is because critical processes
  such as encryption and decryption rely on the consistency
  of information such as part lengths in large files

  -----------------------------------------------------------
*/

const fs = require("fs");
const mongoose = require("mongoose");
const {getAccessToken} = require("./auth-service");

/**
 * @returns {Promise<mongoose.ClientSession>}
 */
function beginSession() {
  return new Promise((resolve, reject) => {
    mongoose
      .startSession()
      .then(session => {
        session.startTransaction();
        resolve(session);
      })
      .catch(reject);
  });
}

/**
 * Given a fileDat obj, returns true if the file is considered large,
 * returns false otherwise.
 * @param {"FileData"} fileDat
 */
function isLargeFile(fileDat) {
  // 1   gb  = 1073741824
  // 150 mb  = 157286400
  // 50  mb  = 52428800
  return (fileDat.size || fileDat.bytes.total) >= 157286400;
}

/**
 * Returns the minimum number of 50Mb parts whose total
 * size would be in the range
 *  [ fileSize, fileSize + 50mb )
 * @param {"FileData"} fileDat
 */
function countPartsForLargeFile(fileDat) {
  // divide into 50mb parts
  let partsCount = Math.ceil((fileDat.size || fileDat.bytes.total) / 52428800);
  // ensure parts is within allowed b2 parts-count range
  return partsCount <= 10000 ? partsCount : 10000;
}

/**
 * Will recursively empty out all files and directories
 * within the specified path
 * @param {string} path
 */
function clearDir(path) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path)) return resolve();
    fs.readdir(path, { withFileTypes: true }, async (err, files) => {
      if (err) return reject(err);
      for (let i in files) {
        let dirEnt = files[i];
        try {
          if (dirEnt.isDirectory()) {
            await clearDir(`${path}/${dirEnt.name}`);
            fs.rmdirSync(`${path}/${dirEnt.name}`);
          } else {
            fs.unlinkSync(`${path}/${dirEnt.name}`);
          }
        } catch (err2) {
          return reject(err2);
        }
      }
      resolve();
    });
  });
}

/**
 * Finds the common localPath prefix between a set of files
 * @param {Array<{localPath: string}>} files
 */
function findCommonPrefix(files) {
  if (files.length == 0) return "";
  for (let i in files) {
    files[i].localPath = normalisePath(files[i].localPath);
  }
  let oldNextPrefix;
  let nextPrefix = files[0].localPath.substr(
    0,
    files[0].localPath.indexOf("/") + 1
  );
  let commonPrefix = "";
  while (nextPrefix) {
    if (files.findIndex(f => !f.localPath.startsWith(nextPrefix)) >= 0) {
      break;
    }
    commonPrefix = nextPrefix;
    nextPrefix += files[0].localPath.substr(
      nextPrefix.length,
      files[0].localPath.indexOf("/", nextPrefix.length + 1) - nextPrefix.length
    );
    if (nextPrefix == oldNextPrefix) break;
    oldNextPrefix = nextPrefix;
  }
  return commonPrefix;
}

/**
 * Replaces all backslashes in `path` with forward-slashes
 * @param {string} path 
 */
function normalisePath(path) {
  return path.replace(new RegExp(regexEscape("\\"), "g"), "/");
}

/**
 * Escapes all special RegExp characters from the string
 * @param {string} s 
 */
function regexEscape(s) {
  if (!RegExp.escape) {
    RegExp.escape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }
  return RegExp.escape(s);
}

/**
 * Converts the given string to a mongoose ObjectId
 * @param {string} s 
 */
function toObjectId(s) {
  return mongoose.Types.ObjectId(s.toString());
}

function oauthHeader(options) {
  let header = {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`
    }
  };
  if (options) return Object.assign(header, options);
  else return header;
}

module.exports = {
  beginSession,
  isLargeFile,
  countPartsForLargeFile,
  clearDir,
  findCommonPrefix,
  normalisePath,
  regexEscape,
  toObjectId,
  oauthHeader
};
