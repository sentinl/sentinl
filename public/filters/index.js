/* global angular */
import nextScheduleOccurrence from './next_schedule_occurrence.filter';
import dateFormat from './date_format.filter';

export default angular.module('apps/sentinl.filters', [
  dateFormat.name,
  nextScheduleOccurrence.name
]);
