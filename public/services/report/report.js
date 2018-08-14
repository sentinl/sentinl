/**
* Handles report documents.
*/

import Alarm from '../alarm/alarm';

class Report extends Alarm {

  constructor($http) {
    super($http);
    this.$http = $http;
  }

  /**
  * Lists all available reports.
  */
  list() {
    return this.$http.get('../api/sentinl/list/reports').catch(function (err) {
      throw new Error('Report list: ' + err.toString());
    });
  };
};

export default Report;
