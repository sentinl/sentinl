/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import es from 'elasticsearch';
import fs from 'fs';
import Crypto from './classes/crypto';

export default function getElasticsearchClient(server, config = false, type = 'data', impersonate = null) {

  // basic auth with impersonation of watchers
  if (config && config.settings.authentication.enabled && config.settings.authentication.mode === 'basic') {
    const getClient = function () {
      const options = {
        hosts: [
          {
            host: config.es.host,
            auth: `${config.settings.authentication.admin_username}:${config.settings.authentication.admin_password}`,
            protocol: config.settings.authentication.https ? 'https' : 'http',
            port: config.es.port
          }
        ]
      };

      if (config.settings.authentication.verify_certificate) {
        options.ssl = {
          ca: fs.readFileSync(config.settings.authentication.path_to_pem),
          rejectUnauthorized: true
        };
      }

      return new es.Client(options);
    };

    let auth;
    if (impersonate && config.settings.authentication.impersonate) {
      server.log(['status', 'debug', 'Sentinl', 'get_elasticsearch_client', 'auth'],
        `Impersonate ES client by ${JSON.stringify(impersonate)}`);

      const crypto = new Crypto(config.settings.authentication.encryption);

      try {
        auth = `${impersonate.username}:${crypto.decrypt(impersonate.sha)}`;
      } catch (err) {
        server.log(['status', 'debug', 'Sentinl', 'get_elasticsearch_client', 'auth'],
          `Failed to decrypt SHA ${JSON.stringify(impersonate)}: ${err}`);
      }
    } else {
      auth = `${config.settings.authentication.admin_username}:${config.settings.authentication.admin_password}`;
    }

    return getClient(auth);
  }

  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlClient();
  }

  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }

  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
