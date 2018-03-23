/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import elasticsearch from 'elasticsearch';
import fs from 'fs';
import Crypto from './classes/crypto';
import Log from './log';

/**
* Get client
*
*/
function esClient(config, username, password) {
  const options = {
    host: [
      {
        host: config.es.host,
        protocol: config.es.protocol,
        port: config.es.port
      }
    ]
  };

  if (username && password) {
    options.host[0].auth = username + ':' + password;
  }

  if (!config.settings.authentication.cert.selfsigned) {
    options.ssl = {
      ca: fs.readFileSync(config.settings.authentication.cert.pem),
      rejectUnauthorized: true,
    };
  }

  return new elasticsearch.Client(options);
};


/**
* Get Elasticsearch client
*
*/
export default function getElasticsearchClient(server, config, type = 'data', impersonate = null) {
  const log = new Log(config.app_name, server, 'get_elasticsearch_client');

  const auth = config.settings.authentication;
  // Basic authentication
  if (auth.enabled) {
    const crypto = new Crypto(auth.encryption);

    if (impersonate) {
      log.debug(`impersonating Elasticsearch client by ${auth.username}:${auth.sha}`);
      return esClient(config, impersonate.username, crypto.decrypt(impersonate.sha));
    }

    if (auth.sha) {
      log.debug(`impersonating Elasticsearch client by ${auth.username}:${auth.sha}`);
      return esClient(config, auth.username, crypto.decrypt(auth.sha));
    }

    log.debug(`impersonating Elasticsearch client by ${auth.username}:${auth.password}`);
    return esClient(config, auth.username, auth.password);
  }

  // Authentication via Kibi Access Control app
  if (server.plugins.kibi_access_control) {
    log.debug('auth via Kibi Access Control');
    return server.plugins.kibi_access_control.getSentinlClient();
  }

  // Authentication via Investigate Access Control app pre Sentinl rename
  if (server.plugins.investigate_access_control) {
    log.debug('auth via Investigate Access Control');
    return server.plugins.investigate_access_control.getSentinlClient();
  }

  log.debug('auth via Kibana server elasticseaarch plugin');
  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }

  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
