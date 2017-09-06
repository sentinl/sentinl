import './saved_user';
import './saved_users';

import savedUsersRegister from './saved_users_register';
import savedObjectRegister from 'plugins/kibana/management/saved_object_registry';
savedObjectRegister.register(savedUsersRegister);
