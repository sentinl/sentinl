import { uiModules } from 'ui/modules';
import conditionPanelWatcherEdit from './condition_panel_watcher_edit';

const module = uiModules.get('apps/sentinl');
module.directive('conditionPanelWatcherEdit', conditionPanelWatcherEdit);
