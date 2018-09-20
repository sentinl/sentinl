import EsClient from './es_client';
import SirenSavedObjectsClient from './siren_saved_objects_client';
import SavedObjectsClient from './saved_objects_client';
import { isKibi } from '../helpers';

export default function ApiFactory(server, apiType, request) {
  let api;

  switch (apiType) {
    case 'elasticsearchAPI':
      api = new EsClient(server);
      break;
    default: // savedObjectsClient
      if (isKibi(server)) {
        api = new SirenSavedObjectsClient(server, request);
      } else { // Kibana
        api = new SavedObjectsClient(server, request);
      }
  }

  return api;
}
