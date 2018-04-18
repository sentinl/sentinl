import { uiModules } from 'ui/modules';
import ddWatcherAggThreshold from './dd_watcher_agg_threshold';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggThreshold', ddWatcherAggThreshold);
