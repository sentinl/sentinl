import './saved_script';
import './saved_scripts';

import savedScriptsRegister from './saved_scripts_register';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
savedObjectManagementRegistry.register(savedScriptsRegister);
