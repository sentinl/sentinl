import { uiModules } from 'ui/modules';
import actionPanelWatcherEdit from './action_panel_watcher_edit';

const module = uiModules.get('apps/sentinl');
module.directive('actionPanelWatcherEdit', actionPanelWatcherEdit);
