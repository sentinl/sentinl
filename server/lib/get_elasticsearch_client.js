/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import elasticsearch from 'elasticsearch';
import fs from 'fs';
import Crypto from './crypto';
import Log from './log';

let log;

/**
* Get client
*
*/
function esClient(server, isSiren, clusterType, config, username, password) {
  if (isSiren) {
    return server.plugins.elasticsearch.getCluster(clusterType).createClient({ username, password });
  }

  const options = {
    host: [
      {
        host: config.es.host,
        protocol: config.es.protocol,
        port: config.es.port
      }
    ]
  };
  log.debug('es client options (password hidden): ' + JSON.stringify(options.host, null, 2));

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
export default function getElasticsearchClient({
  server,
  config,
  type = 'data',
  impersonateUsername = null,
  impersonateSha = null,
  impersonatePassword = null,
  impersonateId = null,
  isSiren = false,
}) {
  log = new Log(config.app_name, server, 'get_elasticsearch_client');

  const auth = config.settings.authentication;
  // Basic authentication
  if (auth.enabled) {
    const crypto = new Crypto(auth.encryption);

    if (impersonateUsername && (impersonateSha || impersonatePassword)) {
      log.debug(`impersonate watcher "${impersonateId}" by its user: "${impersonateUsername}"`);
      if (!impersonateSha) {
        log.debug(`impersonate watcher "${impersonateId}", no SHA found, use clear text password`);
        return esClient(server, isSiren, type, config, impersonateUsername, impersonatePassword);
      }
      return esClient(server, isSiren, type, config, impersonateUsername, crypto.decrypt(impersonateSha));
    }

    if (auth.sha) {
      log.debug(`impersonate Sentinl by common user from config: "${auth.username}" and its SHA`);
      return esClient(server, isSiren, type, config, auth.username, crypto.decrypt(auth.sha));
    }

    if (!server.plugins.investigate_access_control && !server.plugins.kibi_access_control) {
      log.debug(`impersonate Sentinl by common user from config: "${auth.username}"`);
      return esClient(server, isSiren, type, config, auth.username, auth.password);
    }
  }

  // Authentication via Kibi Access Control app
  if (server.plugins.kibi_access_control && server.plugins.kibi_access_control.getSentinlClient) {
    log.debug('auth via Kibi Access Control');
    return server.plugins.kibi_access_control.getSentinlClient();
  }

  // Authentication via Investigate Access Control app pre Sentinl rename
  if (server.plugins.investigate_access_control && server.plugins.investigate_access_control.getSentinlClient) {
    let cluster = server.config().get('elasticsearch.siren.alert.admin.cluster');
    if (!cluster) {
      cluster = 'data';
    }
    log.debug('auth via Investigate Access Control, cluster name: ' + cluster);
    return server.plugins.elasticsearch.getCluster(cluster).createClient({
      username: server.config().get('investigate_access_control.sirenalert.elasticsearch.username'),
      password: server.config().get('investigate_access_control.sirenalert.elasticsearch.password'),
    });
  }

  log.debug('auth via Kibana server elasticsearch plugin');
  return server.plugins.elasticsearch.getCluster(type).getClient();
}
