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
* Do report (pdf or png)
*
* @property {object} horseman - phantomjs helper
* @property {object} action - current report action properties
* @property {string} file - report file full system path
* @property {string} authentication - authentication type
*/
const horsemanReport = function (horseman, action, file, authentication = null) {
  const { url, res, type } = action.report.snapshot;
  const { username, password, delay } = action.report.snapshot.params;

  return horseman
  .viewport(res.split('x')[0], res.split('x')[1])
  .then(function () {
    if (authentication === 'simple') {
      return horseman.authentication(username, password);
    }
    return null;
  })
  .open(url)
  .then(function () {
    if (authentication === 'search_guard_kibana' || authentication === 'search_guard_kibi') {
      return horseman.waitForNextPage()
      .type('input[id="username"]', username)
      .type('input[id="password"]', password)
      .then(function () {
        if (authentication === 'search_guard_kibana') {
          return horseman.click('button[id="login"]');
        }
        return null;
      });
    }
    return null;
  })
  .wait(delay)
  .then(function () {
    if (action.report.snapshot.type === 'pdf') {
      return horseman.pdf(file, {
        width: res.split('x')[0] + 'px',
        height: res.split('x')[1] + 'px',
        margin: '1px'
      });
    }
    return horseman.screenshot(file);
  });
};

module.exports = {
  horsemanFactory,
  horsemanReport
};
