import { uiModules } from 'ui/modules';
import watcherWizardEmailHtmlAction from './watcher_wizard_email_html_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardEmailHtmlAction', watcherWizardEmailHtmlAction);
