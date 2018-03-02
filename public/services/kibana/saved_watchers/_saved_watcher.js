import { uiModules } from 'ui/modules';
const module = uiModules.get('apps/sentinl');

module.factory('SavedWatcherKibana', function (courier, EMAILWATCHER) {
  class SavedWatcherKibana extends courier.SavedObject {
    constructor(id) {
      super({
        type: SavedWatcherKibana.type,
        mapping: SavedWatcherKibana.mapping,
        // if this is null/undefined then the SavedObject will be assigned the defaults
        id: id,
        // default values that will get assigned if the doc is new
        defaults: SavedWatcherKibana.defaults
      });
    }

    // save these objects with the 'sentinl-watcher' type
    static type = 'sentinl-watcher';

    // if type:sentinl-watcher has no mapping, we push this mapping into ES
    static mapping = {
      title: 'string',
      input: 'object',
      actions: 'object',
      transform: 'object',
      condition: 'object',
      report: 'boolean',
      disable: 'boolean',
      trigger: 'object',
    };

    static defaults = EMAILWATCHER;

    // Order these fields to the top, the rest are alphabetical
    static fieldOrder = ['title'];
  }

  return SavedWatcherKibana;
});
