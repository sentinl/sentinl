import UserSavedObjectsApi from '../user_saved_objects_api';
import UserEsApi from '../user_es_api';

class UserFactory {
  constructor($http, $injector) {
    this.docType = 'user';
    this.$http = $http;
    this.$injector = $injector;
  }

  get(apiType) {
    let api;
    switch (apiType) {
      case 'elasticsearchAPI':
        api = new UserEsApi(this.$http, this.$injector);
        break;
      default:
        api = new UserSavedObjectsApi(this.$http, this.$injector);
    }
    return api;
  }
}

export default UserFactory;
