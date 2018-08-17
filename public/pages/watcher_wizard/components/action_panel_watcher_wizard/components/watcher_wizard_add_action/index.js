import { uiModules } from 'ui/modules';
import watcherWizardAddAction from './watcher_wizard_add_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardAddAction', watcherWizardAddAction);
