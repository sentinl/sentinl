import { app } from '../../app.module';
import { SavedObjectLoader } from 'ui/courier/saved_object/saved_object_loader';
import { savedObjectManagementRegistry } from 'plugins/kibana/management/saved_object_registry';
// kibi: imports
import { CacheProvider } from 'ui/kibi/helpers/cache_helper';
// kibi: end

// Register this service with the saved object registry so it can be
// edited by the object editor.
savedObjectManagementRegistry.register({
  service: 'savedUsers',
  title: 'users'
});

// This is the only thing that gets injected into controllers
app.service('savedUsers', function (savedObjectsAPI, savedObjectsAPITypes, Private, SavedUser, kbnIndex, esAdmin, kbnUrl) {
  savedObjectsAPITypes.add('sentinl-user');

  const options = {
    caching: {
      find: true,
      cache: Private(CacheProvider)
    },
    savedObjectsAPI
  };

  return new SavedObjectLoader(SavedUser, kbnIndex, esAdmin, kbnUrl, options);
});
