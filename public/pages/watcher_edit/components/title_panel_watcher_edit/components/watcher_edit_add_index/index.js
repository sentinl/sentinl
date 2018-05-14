import { uiModules } from 'ui/modules';
import watcherEditAddIndex from './watcher_edit_add_index';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditAddIndex', watcherEditAddIndex);
