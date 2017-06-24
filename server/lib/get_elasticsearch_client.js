/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 *
 * By default both watches and alerts history are stored in the data cluster.
 */
export default function getElasticsearchClient(server) {
  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinlClient();
  }
  return server.plugins.elasticsearch.client;
}
