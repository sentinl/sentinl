import { uiModules } from 'ui/modules';
import ddWatcherAggField from './dd_watcher_agg_field';

const module = uiModules.get('apps/sentinl');
module.directive('ddWatcherAggField', ddWatcherAggField);
