import { uiModules } from 'ui/modules';
import WizardHelper from './wizard_helper';

const module = uiModules.get('apps/sentinl');
module.factory('wizardHelper', () => new WizardHelper());
