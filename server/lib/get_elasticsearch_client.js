/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import es from 'elasticsearch';
import fs from 'fs';

export default function getElasticsearchClient(server, config = false, type = 'data') {

  // basic auth
  if (config && config.settings.authentication.enabled && config.settings.authentication.mode === 'basic') {
    const esClientConfig = {
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
      esClientConfig.ssl = {
        ca: fs.readFileSync(config.settings.authentication.path_to_pem),
        rejectUnauthorized: true
      };
    }

    return new es.Client(esClientConfig);
  }

  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlClient();
  }

  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }

  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
