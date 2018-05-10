import { uiModules } from 'ui/modules';
import WatcherEditorChartService from './watcher_editor_chart_service';

const module = uiModules.get('apps/sentinl');
module.factory('watcherEditorChartService', /* @ngInject */
  ($http, API, sentinlLog) => new WatcherEditorChartService($http, API, sentinlLog));
