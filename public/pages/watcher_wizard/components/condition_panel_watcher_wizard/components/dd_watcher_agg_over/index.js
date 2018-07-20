import { uiModules } from 'ui/modules';
import ddWatcherAggOver from './dd_watcher_agg_over';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggOver', ddWatcherAggOver);
