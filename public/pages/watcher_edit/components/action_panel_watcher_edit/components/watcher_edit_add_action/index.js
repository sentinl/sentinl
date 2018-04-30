import { uiModules } from 'ui/modules';
import watcherEditAddAction from './watcher_edit_add_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditAddAction', watcherEditAddAction);
