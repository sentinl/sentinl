/* global angular */

import './watcher_edit';
import './watcher_raw_edit';

import watchersPage from './watchers';
import aboutPage from './about';
import alarmsPage from './alarms';
import reportsPage from './reports';

export default angular.module('apps/sentinl.pages', [
  watchersPage.name,
  aboutPage.name,
  alarmsPage.name,
  reportsPage.name
]);
