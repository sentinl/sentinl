import Promise from 'bluebird';
import path from 'path';
import klawSync from 'klaw-sync';

/**
* Check if Kibi
*
* @param {object} server - Kibana/Kibi Hapi server instance
* @return {boolean}
*/
const isKibi = function (server) {
  return server.plugins.saved_objects_api ? true : false;
};

/**
* Get full sys path by file name
*
* @param {string} fileName
* @param {string} rootPath where to look for the fileName
* @return {string} full sys path to fileName
*/
const getFullPathByFileName = function (fileName, rootPath) {
  const paths = klawSync(rootPath);
  let found = paths.filter((e) => path.basename(e.path) === fileName);
  if (Array.isArray(found) && !!found.length) {
    return found[0].path;
  }
};

module.exports = {
  isKibi,
  getFullPathByFileName,
};
