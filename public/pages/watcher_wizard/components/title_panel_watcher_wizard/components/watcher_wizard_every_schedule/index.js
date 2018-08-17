import { uiModules } from 'ui/modules';
import watcherWizardEverySchedule from './watcher_wizard_every_schedule';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardEverySchedule', watcherWizardEverySchedule);
