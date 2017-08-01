import 'ui/saved_objects_api';
import 'ui/courier';
import 'ui/kibi/mappings';
import './saved_watcher';
import './saved_watchers';

import savedWatchersRegister from './saved_watchers_register';
import savedObjectRegister from 'plugins/kibana/management/saved_object_registry';
savedObjectRegister.register(savedWatchersRegister);
