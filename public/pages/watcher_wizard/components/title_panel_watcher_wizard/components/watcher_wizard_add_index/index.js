import { uiModules } from 'ui/modules';
import watcherWizardAddIndex from './watcher_wizard_add_index';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardAddIndex', watcherWizardAddIndex);
