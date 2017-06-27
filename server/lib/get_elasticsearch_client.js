/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
export default function getElasticsearchClient(server, type = 'data') {
  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlClient();
  }
  if (type === 'data') {
    return server.plugins.elasticsearch.getCluster('data').getClient();
  }
  return server.plugins.elasticsearch.getCluster('admin').getClient();
}
