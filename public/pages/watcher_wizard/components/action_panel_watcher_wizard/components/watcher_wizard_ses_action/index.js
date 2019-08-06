import { uiModules } from 'ui/modules';
import watcherWizardSesAction from './watcher_wizard_ses_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardSesAction', watcherWizardSesAction);
