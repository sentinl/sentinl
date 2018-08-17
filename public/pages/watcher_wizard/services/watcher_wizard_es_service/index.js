import { uiModules } from 'ui/modules';
import WatcherWizardEsService from './watcher_wizard_es_service';

const module = uiModules.get('apps/sentinl');
module.factory('watcherWizardEsService', /* @ngInject */ ($http, API, sentinlHelper) => {
  return new WatcherWizardEsService($http, API, sentinlHelper);
});
