/* global angular */
import moment from 'moment';
import later from 'later';

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
    this.schedule = this.schedule || '0';
    return moment(later.schedule(later.parse.text(this.schedule)).next()).format('D/M/YYYY HH:mm:ss');
  }

  /*
  * @param {string} schedule in English for the 'later' text parser
  * @param {object} sentinlConfig
  */
  static factory(schedule, sentinlConfig) {
    const filter = new NextScheduleOccurrence(schedule, sentinlConfig.es.watcher.schedule_timezone);
    return filter.next();
  }
}

NextScheduleOccurrence.factory.$inject = ['schedule', 'sentinlConfig'];
export default angular.module('nextScheduleOccurrence', []).filter('nextScheduleOccurrence', () => NextScheduleOccurrence.factory);
