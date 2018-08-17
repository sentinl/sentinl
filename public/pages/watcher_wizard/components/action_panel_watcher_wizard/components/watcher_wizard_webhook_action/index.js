import { uiModules } from 'ui/modules';
import watcherWizardWebhookAction from './watcher_wizard_webhook_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardWebhookAction', watcherWizardWebhookAction);
