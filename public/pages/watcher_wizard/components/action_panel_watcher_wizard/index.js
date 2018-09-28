import { uiModules } from 'ui/modules';
import actionPanelWatcherWizard from './action_panel_watcher_wizard';

const module = uiModules.get('apps/sentinl');
module.directive('actionPanelWatcherWizard', actionPanelWatcherWizard);
