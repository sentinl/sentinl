/* global angular */
import moment from 'moment';

/*
* Foramat @timestamp string
*/
class DateFormat {

  /*
  * @param {string} date @timestamp
  */
  constructor(date) {
    this.date = date;
  }

  /*
  * @return {string} date formatted
  */
  format() {
    return moment(this.date).format('YYYY-MM-DD HH:mm:ss.sss');
  }

  /*
  * @param {string} date @timestamp
  */
  static factory(date) {
    const filter = new DateFormat(date);
    return filter.format();
  }
}

DateFormat.factory.$inject = ['date'];
angular.module('apps/sentinl.dateFormat', []).filter('dateFormat', () => DateFormat.factory);
