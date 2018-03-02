import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

module.factory('SavedScriptKibana', function (courier) {
  class SavedScriptKibana extends courier.SavedObject {
    constructor(id) {
      super({
        type: SavedScriptKibana.type,
        mapping: SavedScriptKibana.mapping,
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedScriptKibana.defaults
      });
    }

    // save these objects with the 'sentinl-script' type
    static type = 'sentinl-script';

    // if type:sentinl-script has no mapping, we push this mapping into ES
    static mapping = {
      title: 'string',
      description: 'string',
      body: 'string',
    };

    static defaults = {};

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title'];
  }

  return SavedScriptKibana;
});
