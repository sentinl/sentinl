import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

// Used only by the savedWatchers service, usually no reason to change this
module.factory('SavedWatcher', function (courier) {
  // SavedWatcher constructor. Usually you'd interact with an instance of this.
  // ID is option, without it one will be generated on save.

  class SavedWatcher extends courier.SavedObject {

    constructor(id) {
      super({
        searchSource: false,

        type: SavedWatcher.type,

        mapping: {
          title: 'string',
          input: 'object',
          actions: 'object',
          transform: 'object',
          condition: 'object',
          report: 'boolean',
          disable: 'boolean',
          trigger: 'object'
        },
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedWatcher.defaults || {},
      });
    }

    static type = 'sentinl-watcher'
  };

  return SavedWatcher;
});
