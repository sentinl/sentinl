import Promise from 'bluebird';

/**
 * Returns a Promise resolved with a Horseman instance.
 *
 * @param {Server} server - A Server instance.
 * @param {string} url - An optional authentication domain.
 *
 * @return {Promise}.
 */
export default function horsemanFactory(server, domain) {

  let horseman;

  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlHorseman(domain);
  } else {
    try {
      const Horseman = require('node-horseman');
      return Promise.resolve(new Horseman({ 'ignoreSSLErrors': true }));
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
