/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import es from 'elasticsearch';
import fs from 'fs';
import Crypto from './classes/crypto';

export default function getElasticsearchClient(server, config = false, type = 'data', impersonate = null) {

  // Basic authentication for watchers
  if (config && config.settings.authentication.enabled && config.settings.authentication.mode === 'basic') {

    /**
    * Get Elasticsearch client.
    *
    * @param {string} authPair - authentication pair 'username:password'
    */
    const getClient = function (authPair) {
      const options = {
        hosts: [
          {
            host: config.es.host,
            auth: authPair,
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

    const crypto = new Crypto(config.settings.authentication.encryption);

    let authPair;
    if (impersonate) {
      authPair = `${impersonate.username}:${crypto.decrypt(impersonate.sha)}`;
    } else {
      authPair = `${config.settings.authentication.admin_username}:${crypto.decrypt(config.settings.authentication.admin_sha)}`;
    }
    server.log(['status', 'debug', 'Sentinl', 'get_elasticsearch_client', 'AUTH'],
      `Impersonate ES client by ${authPair.split(':')[0]}`);

    return getClient(authPair);
  }

  // Authentication via Kibi Access Control app
  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlClient();
  }

  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }

  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
