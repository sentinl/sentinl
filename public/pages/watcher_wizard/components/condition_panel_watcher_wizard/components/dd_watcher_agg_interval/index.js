import { uiModules } from 'ui/modules';
import ddWatcherAggInterval from './dd_watcher_agg_interval';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggInterval', ddWatcherAggInterval);
