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
    return this.$http.get('../api/sentinl/list/reports')
      .then((response) => {
        if (response.status !== 200) {
          throw new Error('Fail to list reports');
        }
        return response;
      });
  };

};

export default Report;
