/*global angular*/
const Alarm = function ($http) {

  /**
  * Handles alarm documents.
  */
  return class Alarm {

    /**
    * Lists all available alarms.
    */
    static list() {
      return $http.get('../api/sentinl/list/alarms')
        .then((response) => {
          if (response.status !== 200) {
            throw new Error('Fail to list alarms');
          }
          return response;
        });
    };


    /**
    * Deletes single alarm.
    *
    * @param {string} index - index name.
    * @param {string} type - alarm type.
    * @param {string} id - alarm id.
    */
    static delete(index, type, id) {
      return $http.delete(`../api/sentinl/alarm/${index}/${type}/${id}`)
        .then((response) => {
          if (response.status !== 200) {
            throw new Error(`Fail to delete alarm or report ${id}`);
          }
          return id;
        });
    };

    /**
    * Sets timepicker filter time interval.
    *
    * @param {object} timeInterval - timepicker time.
    */
    static updateFilter(timeInterval) {
      return $http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F'))
        .then((response) => {
          if (response.status !== 200) {
            throw new Error('Fail to set time filter');
          }
          return response;
        });
    };

  };

};

Alarm.$inject = ['$http'];
export default angular.module('apps/sentinl.alarm', []).factory('Alarm', Alarm);
