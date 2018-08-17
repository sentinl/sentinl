import { uiModules } from 'ui/modules';
import impersonationPanelWatcherWizard from './impersonation_panel_watcher_wizard';

const module = uiModules.get('apps/sentinl');
module.directive('impersonationPanelWatcherWizard', impersonationPanelWatcherWizard);
