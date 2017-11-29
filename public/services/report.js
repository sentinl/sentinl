/*global angular*/
const Report = function ($http, Alarm) {

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

};

Report.$inject = ['$http', 'Alarm'];
export default angular.module('apps/sentinl.report', []).factory('Report', Report);
