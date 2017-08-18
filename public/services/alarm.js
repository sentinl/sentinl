import { app } from '../app.module';
import _ from 'lodash';

app.factory('Alarm', ['$http', function ($http) {

  /**
  * Handles alarm documents.
  */
  return class Alarm {

    /**
    * Lists all available alarms.
    */
    static list() {
      return $http.get('../api/sentinl/list/alarms');
    };


    /**
    * Deletes single alarm.
    */
    static delete(index, type, id) {
      return $http.delete(`../api/sentinl/alarm/${index}/${type}/${id}`);
    };

    /**
    * Sets timepicker filter time interval.
    *
    * @param {object} timeInterval - timepicker time.
    */
    static updateFilter(timeInterval) {
      return $http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F'));
    };

  };

}]);
