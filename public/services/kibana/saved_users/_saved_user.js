import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

module.factory('SavedUserKibana', function (courier, sentinlConfig) {
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

    // save these objects with the user type
    static type = sentinlConfig.es.user_type;

    // if type:sentinl-user has no mapping, we push this mapping into ES
    static mapping = {
      username: 'string',
      password: 'string',
      sha: 'string',
    };

    static defaults = {};

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['username'];
  }

  return SavedUserKibana;
});
