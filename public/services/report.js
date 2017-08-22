import { app } from '../app.module';
import _ from 'lodash';

app.factory('Report', ['$http', 'Alarm', function ($http, Alarm) {

  /**
  * Handles report documents.
  */
  return class Report extends Alarm {

    /**
    * Lists all available reports.
    */
    static list() {
      return $http.get('../api/sentinl/list/reports')
        .then((response) => {
          if (response.status !== 200) {
            throw new Error('Fail to list reports');
          }
          return response;
        });
    };

  };

}]);
