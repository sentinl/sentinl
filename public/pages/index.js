/* global angular */

import watchersPage from './watchers';
import editorPage from './editor';
import aboutPage from './about';
import alarmsPage from './alarms';
import reportsPage from './reports';

export default angular.module('apps/sentinl.pages', [
  watchersPage.name,
  editorPage.name,
  aboutPage.name,
  alarmsPage.name,
  reportsPage.name
]);
