import { uiModules } from 'ui/modules';
import watcherEditReportAction from './watcher_edit_report_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherEditReportAction', watcherEditReportAction);
