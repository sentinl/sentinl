import { uiModules } from 'ui/modules';

const module = uiModules.get('apps/sentinl');

// Used only by the savedUsers service, usually no reason to change this
module.factory('SavedUser', function (courier) {
  // SavedUser constructor. Usually you'd interact with an instance of this.
  // ID is option, without it one will be generated on save.

  class SavedUser extends courier.SavedObject {

    constructor(id) {
      super({
        searchSource: false,

        type: SavedUser.type,

        mapping: {
          watcher_id: 'string',
          username: 'string',
          password: 'string'
        },
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedUser.defaults || {},
      });
    }

    static type = 'sentinl-user'
  };

  return SavedUser;
});
