import _ from 'lodash';
import { app } from '../../app.module';

// Used only by the savedWatchers service, usually no reason to change this
app.factory('SavedWatcher', function (courier, config) {
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
        defaults: {
          title: 'watcher_title',
          disable: false,
          uuid: id,
          trigger: JSON.stringify({
            schedule: {
              later: 'every 5 minutes'
            }
          }),
          input: JSON.stringify({
            search: {
              request: {
                index: [],
                body: {},
              }
            }
          }),
          condition: JSON.stringify({
            script: {
              script: 'payload.hits.total > 100'
            }
          }),
          transform: JSON.stringify({
            script: {
              script: ''
            }
          }),
          actions: JSON.stringify({
            email_admin: {
              throttle_period: '15m',
              email: {
                to: 'alarm@localhost',
                from: 'sentinl@localhost',
                subject: 'Sentinl Alarm',
                priority: 'high',
                body: 'Found {{payload.hits.total}} Events'
              }
            }
          })
        }
      });
    }

    static type = 'sentinl-watcher'
  };

  return SavedWatcher;
});
