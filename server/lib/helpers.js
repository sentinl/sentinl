import Promise from 'bluebird';

/**
* Check if Kibi
*
* @param {object} server - Kibana/Kibi Hapi server instance
* @return {boolean}
*/
const isKibi = function (server) {
  return server.plugins.saved_objects_api ? true : false;
};

const delay = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

module.exports = {
  isKibi,
  delay,
};
