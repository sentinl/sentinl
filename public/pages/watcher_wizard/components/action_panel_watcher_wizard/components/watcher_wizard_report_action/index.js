import { uiModules } from 'ui/modules';
import watcherWizardReportAction from './watcher_wizard_report_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardReportAction', watcherWizardReportAction);
