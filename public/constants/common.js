/* global angular */

const COMMON = {
  description: 'Report/Alarm application',
  reports: {
    title: 'Reports',
  },
  watchers: {
    title: 'Watchers',
  },
  alarms: {
    title: 'Alarms',
  },
  editor: {
    title: 'Editor',
  },
  about: {
    title: 'About',
  },
};

angular.module('apps/sentinl.commonConstants', []).constant('COMMON', COMMON);
