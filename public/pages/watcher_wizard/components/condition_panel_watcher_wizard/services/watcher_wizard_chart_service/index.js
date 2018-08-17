import { uiModules } from 'ui/modules';
import WatcherWizardChartService from './watcher_wizard_chart_service';

const module = uiModules.get('apps/sentinl');
module.factory('watcherWizardChartService', /* @ngInject */
  ($http, API, sentinlHelper) => new WatcherWizardChartService($http, API, sentinlHelper));
