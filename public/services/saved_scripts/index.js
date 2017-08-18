import './saved_script';
import './saved_scripts';

import savedScriptsRegister from './saved_scripts_register';
import savedObjectRegister from 'plugins/kibana/management/saved_object_registry';
savedObjectRegister.register(savedScriptsRegister);
