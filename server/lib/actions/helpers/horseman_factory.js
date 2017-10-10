import Promise from 'bluebird';

/**
 * Return a Promise resolved with a Horseman instance.
 *
 * @param {Server} server - A Server instance.
 * @param {string} url - An optional authentication domain.
 *
 * @return {object} Horseman.
 */
const horsemanFactory = function (server, domain) {
  let horseman;

  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlHorseman(domain);
  } else {
    try {
      const Horseman = require('node-horseman');

      const options = {
        'ignoreSSLErrors': true,
        'phantomPath': server.plugins.sentinl.phantomjs_path
      };

      return Promise.resolve(new Horseman(options));
    } catch (error) {
      return Promise.reject(error);
    }
  }
};

/**
* Do screenshot accessing URL with simple authentication
*
* @param {object} horseman - phantomjs helper
* @param {string} username
* @param {string} password
* @param {string} url
* @param {integer} delay - time to wait after URL was opened
* @param {string} resolution - image size
* @param {string} file - screenshot image full path
*/
const horsemanSimpleAuth = function (horseman, username, password, url, delay, resolution, file) {
  return horseman
  .viewport(resolution.split('x')[0], resolution.split('x')[1])
  .authentication(username, password)
  .open(url)
  .wait(delay)
  .screenshot(file);
};

/**
* Do screenshot accessing URL with no authentication
*
* @param {object} horseman - phantomjs helper
* @param {string} url
* @param {integer} delay - time to wait after URL was opened
* @param {string} resolution - image size
* @param {string} file - screenshot image full path
*/
const horsemanNoAuth = function (horseman, url, delay, resolution, file) {
  return horseman
  .viewport(resolution.split('x')[0], resolution.split('x')[1])
  .open(url)
  .wait(delay)
  .screenshot(file);
};

/**
* Do screenshot accessing Kibana URL protected by Search Guard
*
* @param {object} horseman - phantomjs helper
* @param {string} username
* @param {string} password
* @param {string} url
* @param {integer} delay - time to wait after URL was opened
* @param {string} resolution - image size
* @param {string} file - screenshot image full path
*/
const horsemanSearchGuardKibana = function (horseman, username, password, url, delay, resolution, file) {
  return horseman
  .viewport(resolution.split('x')[0], resolution.split('x')[1])
  .open(url)
  .waitForNextPage()
  .type('input[id="username"]', username)
  .type('input[id="password"]', password)
  .click('button[id="login"]')
  .wait(delay)
  .screenshot(file);
};

/**
* Do screenshot accessing Kibi URL protected by Search Guard
*
* @param {object} horseman - phantomjs helper
* @param {string} username
* @param {string} password
* @param {string} url
* @param {integer} delay - time to wait after URL was opened
* @param {string} resolution - image size
* @param {string} file - screenshot image full path
*/
const horsemanSearchGuardKibi = function (horseman, username, password, url, delay, resolution, file) {
  return horseman
  .viewport(resolution.split('x')[0], resolution.split('x')[1])
  .open(url)
  .waitForNextPage()
  .type('input[id="username"]', username)
  .type('input[id="password"]', password)
  .wait(delay)
  .screenshot(file);
};

module.exports = {
  horsemanFactory,
  horsemanSimpleAuth,
  horsemanNoAuth,
  horsemanSearchGuardKibana,
  horsemanSearchGuardKibi
};
