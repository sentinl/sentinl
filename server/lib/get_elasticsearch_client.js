/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import es from 'elasticsearch';
import fs from 'fs';
import Crypto from './classes/crypto';
import Log from './log';

export default function getElasticsearchClient(server, config, type = 'data', impersonate = null) {
  const log = new Log(config.app_name, server, 'get_elasticsearch_client');

  // Basic authentication for watchers
  if (config.settings.authentication.enabled && config.settings.authentication.mode === 'basic') {

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
    log.debug(`impersonating Elasticsearch client by ${authPair.split(':')[0]}`);

    return getClient(authPair);
  }

  // Authentication via Kibi Access Control app
  if (server.plugins.kibi_access_control) {
    const kibiAccessControlConfig = server.config().get('kibi_access_control');
    if (kibiAccessControlConfig && kibiAccessControlConfig.enabled) {
      return server.plugins.kibi_access_control.getSentinlClient();
    }
  }

  // Authentication via Investigate Access Control app pre Sentinl rename
  if (server.plugins.investigate_access_control) {
    const investigateAccessControlConfig = server.config().get('investigate_access_control');
    if (investigateAccessControlConfig && investigateAccessControlConfig.enabled) {
      return server.plugins.investigate_access_control.getSentinlClient();
    }
  }

  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }

  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
