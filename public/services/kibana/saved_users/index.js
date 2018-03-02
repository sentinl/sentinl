import './saved_users';
import './_saved_user';

import { SavedObjectRegistryProvider } from 'ui/saved_objects/saved_object_registry';
import savedUserRegister from './saved_user_register';
SavedObjectRegistryProvider.register(savedUserRegister);
