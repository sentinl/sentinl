/* global angular, later:false */
import moment from 'moment-timezone';
import 'later/later';

/*
* Get the next occurence of from the 'later' lib text schedule
*/
class NextScheduleOccurrence {

  /*
  * @param {string} schedule in English for the 'later' text parser
  * @param {timezone} timezone - UTC (default), local
  */
  constructor(schedule, timezone) {
    this.schedule = schedule;
    this.timezone = timezone;
  }

  /*
  * @return {string} the future occurrence for the schedule
  */
  next() {
    if (this.timezone === 'local') {
      later.date.localTime();
    }
    this.schedule = this.schedule || 'every 1 hours';
    return moment(later.schedule(later.parse.text(this.schedule)).next()).format('D/M/YYYY HH:mm:ss');
  }

  /*
  * @param {string} schedule in English for the 'later' text parser
  * @param {string} timezone: local, utc
  */
  static factory(schedule, timezone) {
    const filter = new NextScheduleOccurrence(schedule, timezone);
    return filter.next();
  }
}

NextScheduleOccurrence.factory.$inject = ['schedule', 'timezone'];
angular.module('apps/sentinl.nextScheduleOccurrence', []).filter('nextScheduleOccurrence', () => NextScheduleOccurrence.factory);
