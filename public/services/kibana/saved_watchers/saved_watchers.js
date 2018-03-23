import { SavedObjectLoader } from 'ui/courier/saved_object/saved_object_loader';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { uiModules } from 'ui/modules';
import './_saved_watcher.js';

const module = uiModules.get('apps/sentinl');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedWatchersKibana',
  title: 'watchers'
});

// This is the only thing that gets injected into controllers
module.service('savedWatchersKibana', function (Promise, SavedWatcherKibana, kbnIndex, kbnUrl, $http, chrome) {
  const savedWatcherLoader = new SavedObjectLoader(SavedWatcherKibana, kbnIndex, kbnUrl, $http, chrome);
  savedWatcherLoader.urlFor = function (id) {
    return kbnUrl.eval('#/{{id}}', { id: id });
  };

  // Customize loader properties since adding an 's' on type doesn't work for type 'sentinl-watcher'.
  savedWatcherLoader.loaderProperties = {
    name: 'sentinl-watcher',
    noun: 'Saved Watchers',
    nouns: 'saved watchers'
  };
  return savedWatcherLoader;
});
