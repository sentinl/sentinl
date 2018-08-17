import { uiModules } from 'ui/modules';
import watcherWizardSlackAction from './watcher_wizard_slack_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardSlackAction', watcherWizardSlackAction);
