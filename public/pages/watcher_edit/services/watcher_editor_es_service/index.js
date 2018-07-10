import { uiModules } from 'ui/modules';
import WatcherEditorEsService from './watcher_editor_es_service';

const module = uiModules.get('apps/sentinl');
module.factory('watcherEditorEsService', /* @ngInject */ ($http, API) => new WatcherEditorEsService($http, API));
