import { uiModules } from 'ui/modules';
import thresholdWatcherWizard from './threshold_watcher_wizard';

const module = uiModules.get('apps/sentinl');
module.directive('thresholdWatcherWizard', thresholdWatcherWizard);
