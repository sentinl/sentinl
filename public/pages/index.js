/* global angular */

import watchersPage from './watchersController';
import editorPage from './editorController';
import aboutPage from './aboutController';
import alarmsPage from './alarmsController';
import reportsPage from './reportsController';
import confirmMessage from './confirmMessageController';

export default angular.module('apps/sentinl.pages', [
  watchersPage.name,
  editorPage.name,
  aboutPage.name,
  alarmsPage.name,
  reportsPage.name,
  confirmMessage.name
]);
