import { uiModules } from 'ui/modules';
import thresholdWatcherEdit from './threshold_watcher_edit';

const module = uiModules.get('apps/sentinl');
module.directive('thresholdWatcherEdit', thresholdWatcherEdit);
