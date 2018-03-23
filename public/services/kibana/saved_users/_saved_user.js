import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

module.factory('SavedUserKibana', function (courier) {
  class SavedUserKibana extends courier.SavedObject {
    constructor(id) {
      super({
        type: SavedUserKibana.type,
        mapping: SavedUserKibana.mapping,
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedUserKibana.defaults
      });
    }

    // save these objects with the 'sentinl-user' type
    static type = 'sentinl-user';

    // if type:sentinl-user has no mapping, we push this mapping into ES
    static mapping = {
      title: 'string',
      description: 'string',
      body: 'string',
    };

    static defaults = {};

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title'];
  }

  return SavedUserKibana;
});
