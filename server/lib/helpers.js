const fs = require('fs');
const path = require('path');
const moment = require('moment');

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

const flatAttributes = function (doc) {
  if (!doc.attributes) {
    return doc;
  }

  if (doc._index) {
    doc.attributes._index = doc._index;
  }

  doc.attributes.id = doc.id;
  return doc.attributes;
};

const getCurrentTime = function () {
  return new Date().toISOString();
};

const createMultipleHapijsRoutes = function (routes) {
  routes = [].concat(routes);
  return routes.reduce((collect, route) => {
    const paths = [].concat(route.path);
    return collect.concat(paths.map((path) => ({ ...route, path })));
  }, []);
};

const trimIdTypePrefix = function (id) {
  return id.includes(':') ? id.split(':')[1] : id;
};

const getTodaysAlarmIndex = function (indexName) {
  return indexName + '-' + moment().format('YYYY.MM.DD');
};

module.exports = {
  trimIdTypePrefix,
  getCurrentTime,
  flatAttributes,
  isKibi,
  listAllFilesSync,
  pickDefinedValues,
  makeExecutableIfNecessary,
  createMultipleHapijsRoutes,
  getTodaysAlarmIndex,
};
