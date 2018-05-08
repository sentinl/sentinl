import { uiModules } from 'ui/modules';
import WatcherHelper from './watcher_helper';

const module = uiModules.get('apps/sentinl');
module.factory('watcherHelper', () => new WatcherHelper());
