import EsClient from './es_client';

export default function ApiFactory(server, request, apiType) {
  let api;

  switch (apiType) {
    case 'elasticsearchAPI':
      api = new EsClient(server);
      break;
    default: // savedObjectsClient
      const { callWithRequest } = server.plugins.elasticsearch.getCluster('admin');
      const callCluster = (...args) => callWithRequest(request, ...args);
      api = server.savedObjectsClientFactory({ callCluster });
  }

  return api;
}
