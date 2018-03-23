import { SavedObjectLoader } from 'ui/courier/saved_object/saved_object_loader';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { uiModules } from 'ui/modules';
import './_saved_user.js';

const module = uiModules.get('apps/sentinl');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedUsersKibana',
  title: 'users'
});

// This is the only thing that gets injected into controllers
module.service('savedUsersKibana', function (Promise, SavedUserKibana, kbnIndex, kbnUrl, $http, chrome) {
  const savedUserLoader = new SavedObjectLoader(SavedUserKibana, kbnIndex, kbnUrl, $http, chrome);
  savedUserLoader.urlFor = function (id) {
    return kbnUrl.eval('#/{{id}}', { id: id });
  };

  // Customize loader properties since adding an 's' on type doesn't work for type 'sentinl-script'.
  savedUserLoader.loaderProperties = {
    name: 'sentinl-user',
    noun: 'Saved Users',
    nouns: 'saved users'
  };
  return savedUserLoader;
});
