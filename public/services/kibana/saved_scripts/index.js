import './saved_scripts';
import './_saved_script';

import { SavedObjectRegistryProvider } from 'ui/saved_objects/saved_object_registry';
import savedScriptRegister from './saved_script_register';
SavedObjectRegistryProvider.register(savedScriptRegister);
