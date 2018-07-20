import { uiModules } from 'ui/modules';
import titlePanelWatcherWizard from './title_panel_watcher_wizard';

const module = uiModules.get('apps/sentinl');
module.directive('titlePanelWatcherWizard', titlePanelWatcherWizard);
