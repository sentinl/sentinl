const fs = require('fs');
const path = require('path');

/**
* Check if Kibi
*
* @param {object} server - Kibana/Kibi Hapi server instance
* @return {boolean}
*/
const isKibi = function (server) {
  return server.plugins.saved_objects_api ? true : false;
};

const listAllFilesSync = function (dir, filesArr) {
  filesArr = filesArr || [];
  fs.readdirSync(dir).map(name => path.join(dir, name)).forEach(function (file) {
    if (fs.lstatSync(file).isDirectory()) {
      filesArr = listAllFilesSync(file, filesArr);
    } else {
      filesArr.push(file);
    }
  });
  return filesArr;
};

const pickDefinedValues = function (obj) {
  return JSON.parse(JSON.stringify(obj));
};

const makeExecutableIfNecessary = function (filename) {
  try {
    fs.accessSync(filename, fs.constants.X_OK);
  } catch (err) {
    fs.chmodSync(filename, '755');
  }
};

module.exports = {
  isKibi,
  listAllFilesSync,
  pickDefinedValues,
  makeExecutableIfNecessary,
};
