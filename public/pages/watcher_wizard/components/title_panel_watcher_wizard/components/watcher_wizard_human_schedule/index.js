import { uiModules } from 'ui/modules';
import watcherWizardHumanSchedule from './watcher_wizard_human_schedule';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardHumanSchedule', watcherWizardHumanSchedule);
