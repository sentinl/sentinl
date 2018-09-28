import { SavedObjectLoader } from 'ui/courier/saved_object/saved_object_loader';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
import { uiModules } from 'ui/modules';
import './_saved_script.js';

const module = uiModules.get('apps/sentinl');

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedScriptsKibana',
  title: 'scripts'
});

// This is the only thing that gets injected into controllers
module.service('savedScriptsKibana', function (Promise, SavedScriptKibana, kbnIndex, kbnUrl, $http, chrome) {
  const savedScriptLoader = new SavedObjectLoader(SavedScriptKibana, kbnIndex, kbnUrl, $http, chrome);
  savedScriptLoader.urlFor = function (id) {
    return kbnUrl.eval('#/{{id}}', { id: id });
  };

  // Customize loader properties since adding an 's' on type doesn't work for type 'sentinl-script'.
  savedScriptLoader.loaderProperties = {
    name: 'sentinl-script',
    noun: 'Saved Scripts',
    nouns: 'saved scripts'
  };
  return savedScriptLoader;
});
