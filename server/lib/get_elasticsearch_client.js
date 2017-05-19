/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 */
export default function getElasticsearchClient(server, type = 'data') {
  if (type === 'data') {
    if (server.plugins.kibi_access_control) {
      return server.plugins.kibi_access_control.getSentinlClient();
      console.log('KIBI ACCESS CONTROL');
    }
    return server.plugins.elasticsearch.getCluster('data');
  }
  return server.plugins.elasticsearch.getCluster('admin');
}
