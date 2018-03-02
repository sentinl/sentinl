import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

// Used only by the savedScripts service, usually no reason to change this
module.factory('SavedScript', function (courier) {
  // SavedScript constructor. Usually you'd interact with an instance of this.
  // ID is option, without it one will be generated on save.

  class SavedScript extends courier.SavedObject {

    constructor(id) {
      super({
        searchSource: false,

        type: SavedScript.type,

        mapping: {
          title: 'string',
          description: 'string',
          body: 'string'
        },
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedScript.defaults || {},
      });
    }

    static type = 'sentinl-script'
  };

  return SavedScript;
});
