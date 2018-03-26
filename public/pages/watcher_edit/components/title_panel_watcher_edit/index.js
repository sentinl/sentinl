import { uiModules } from 'ui/modules';
import titlePanelWatcherEdit from './title_panel_watcher_edit';

const module = uiModules.get('apps/sentinl');
module.directive('titlePanelWatcherEdit', titlePanelWatcherEdit);
