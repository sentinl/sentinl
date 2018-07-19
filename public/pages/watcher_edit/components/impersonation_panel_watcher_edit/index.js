import { uiModules } from 'ui/modules';
import impersonationPanelWatcherEdit from './impersonation_panel_watcher_edit';

const module = uiModules.get('apps/sentinl');
module.directive('impersonationPanelWatcherEdit', impersonationPanelWatcherEdit);
