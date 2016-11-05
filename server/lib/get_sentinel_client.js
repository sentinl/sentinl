/**
 * Returns the Elasticsearch client used to create indices, execute watches and store alarms.
 */
export default function (server) {
  if (server.plugins.kibi_access_control) {
    return server.plugins.kibi_access_control.getSentinelClient();
  }
  return server.plugins.elasticsearch.client;
}
