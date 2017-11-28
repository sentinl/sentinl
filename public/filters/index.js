/* global angular */
import nextScheduleOccurrence from './next-schedule-occurrence.filter';
import dateFormat from './date-format.filter';

export default angular.module('apps/sentinl.filters', [
  dateFormat.name,
  nextScheduleOccurrence.name
]);
