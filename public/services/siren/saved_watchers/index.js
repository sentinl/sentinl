import 'ui/saved_objects_api';
import 'ui/kibi/mappings';
import './saved_watcher';
import './saved_watchers';

import savedWatchersRegister from './saved_watchers_register';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
savedObjectManagementRegistry.register(savedWatchersRegister);
