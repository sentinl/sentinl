import './saved_user';
import './saved_users';

import savedUsersRegister from './saved_users_register';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
savedObjectManagementRegistry.register(savedUsersRegister);
