const {readdirSync, chmodSync, lstatSync} = require('fs');
const {join} = require('path');

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
  readdirSync(dir).map(name => join(dir, name)).forEach(function (file) {
    if (lstatSync(file).isDirectory()) {
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

module.exports = {
  isKibi,
  listAllFilesSync,
  pickDefinedValues,
};
