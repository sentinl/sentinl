import { uiModules } from 'ui/modules';
import watcherWizardElasticAction from './watcher_wizard_elastic_action';

const module = uiModules.get('apps/sentinl');
module.directive('watcherWizardElasticAction', watcherWizardElasticAction);
