import { uiModules } from 'ui/modules';
import watcherEditEverySchedule from './watcher_edit_every_schedule';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditEverySchedule', watcherEditEverySchedule);
