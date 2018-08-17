import { uiModules } from 'ui/modules';
import watcherWizardConsoleAction from './watcher_wizard_console_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardConsoleAction', watcherWizardConsoleAction);
