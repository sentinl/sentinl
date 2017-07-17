/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
import es from 'elasticsearch';

export default function getElasticsearchClient(server, config = false, type = 'data') {
  if (config && config.settings.authentication.enabled && config.settings.authentication.mode === 'basic') {
    const esClientConfig = {
      host: [
        {
          host: config.es.host,
          auth: `${config.settings.authentication.admin_username}:${config.settings.authentication.admin_password}`,
          protocol: config.settings.authentication.https ? 'https' : 'http',
          port: config.es.port
        }
      ]
    };
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
