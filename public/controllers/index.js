/* global angular */

import WatchersController from './watchersController';
import EditorController from './editorController';

export default angular.module('apps/sentinl.controllers', [
  WatchersController.name,
  EditorController.name
]);
