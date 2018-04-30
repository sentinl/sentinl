import { uiModules } from 'ui/modules';
import watcherEditEmailAction from './watcher_edit_email_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditEmailAction', watcherEditEmailAction);
