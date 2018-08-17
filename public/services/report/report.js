/**
* Handles report documents.
*/

import Alarm from '../alarm/alarm';

class Report extends Alarm {

  constructor($http, sentinlHelper) {
    super($http);
    this.$http = $http;
    this.sentinlHelper = sentinlHelper;
  }

  /**
  * Lists all available reports.
  */
  list() {
    return this.$http.get('../api/sentinl/list/reports').catch(function (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Report list'));
    });
  };
};

export default Report;
