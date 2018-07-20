import { uiModules } from 'ui/modules';
import watcherWizardEmailAction from './watcher_wizard_email_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardEmailAction', watcherWizardEmailAction);
