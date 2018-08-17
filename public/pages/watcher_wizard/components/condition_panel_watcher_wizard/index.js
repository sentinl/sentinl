import { uiModules } from 'ui/modules';
import conditionPanelWatcherWizard from './condition_panel_watcher_wizard';

const module = uiModules.get('apps/sentinl');
module.directive('conditionPanelWatcherWizard', conditionPanelWatcherWizard);
