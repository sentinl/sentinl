import './saved_watchers';
import './_saved_watcher';

import { SavedObjectRegistryProvider } from 'ui/saved_objects/saved_object_registry';
import savedWatcherRegister from './saved_watcher_register';
SavedObjectRegistryProvider.register(savedWatcherRegister);
