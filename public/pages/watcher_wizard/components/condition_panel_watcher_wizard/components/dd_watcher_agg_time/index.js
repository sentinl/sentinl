import { uiModules } from 'ui/modules';
import ddWatcherAggTime from './dd_watcher_agg_time';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggTime', ddWatcherAggTime);
