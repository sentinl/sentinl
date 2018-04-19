import { uiModules } from 'ui/modules';
import watcherEditHumanSchedule from './watcher_edit_human_schedule';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditHumanSchedule', watcherEditHumanSchedule);
