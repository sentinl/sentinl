import { uiModules } from 'ui/modules';
import ddWatcherAggType from './dd_watcher_agg_type';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggType', ddWatcherAggType);
