/* KAAE INDICES HELPERS */

var dynamicTemplates = [ {
  string_fields : {
    mapping : {
      type : 'string',
      index : 'not_analyzed',
      type : 'string',
      doc_values: true,
      fields : {
        search : {
          index : 'analyzed',
          omit_norms : true,
          type : 'string',
        }
      }
    },
    match_mapping_type : 'string',
    match : '*'
  }
}];


function createKaaeIndex(server,config) {
        server.log(['status', 'info', 'KaaE'], 'Core Index check...');
        if (!server.plugins.elasticsearch) {
          server.log(['status', 'error', 'KaaE'], 'Elasticsearch client not available, retrying in 5s');
          tryCreate();
          return;
        }

        var client = server.plugins.elasticsearch.client;
        client.indices.exists({
          index: config.es.default_index
        }, function (error, exists) {
            if (exists === true) {
                server.log(['status', 'debug', 'KaaE'], 'Core Index exists!');
                return;
            }
            client.indices.create({
                index: config.es.default_index,
                body: {
                  settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                  }
                }
              })
              .then(function (resp) {
                   server.log(['status', 'info', 'KaaE'], 'Core Index response', resp);
              }, function (err) {
                   server.log(['status', 'warning', 'KaaE'], err.message);
              });
        });
}

var tryCount = 0;
function tryCreate() {
  if (tryCount > 5) {
      server.log(['status', 'warning', 'KaaE'], 'Failed creating Indices mapping!');
  return;
  }
  setTimeout(createKaaeIndex, 5000);
  tryCount++;
}


function createKaaeAlarmIndex(server,config) {
        server.log(['status', 'info', 'KaaE'], 'Alarm Index check...');
        if (!server.plugins.elasticsearch) {
          server.log(['status', 'error', 'KaaE'], 'Elasticsearch client not available, retrying in 5s');
          tryAlarmCreate();
          return;
        }

        var client = server.plugins.elasticsearch.client;
        client.indices.exists({
          index: config.es.alarm_index
        }, function (error, exists) {
            if (exists === true) {
                server.log(['status', 'debug', 'KaaE'], 'Alarms Index exists!');
                return;
            }
            client.indices.create({
                index: config.es.alarm_index,
                body: {
                  settings: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                  }
                }
            })
            .then(function (resp) {
                   server.log(['status', 'info', 'KaaE'], 'Alarm Index response', resp);
            }, function (err) {
                   server.log(['error', 'warning', 'KaaE'], err.message);
            });
        });
}

var tryAlarmCount = 0;
function tryAlarmCreate() {
  if (tryCount > 5) {
      server.log(['error', 'warning', 'KaaE'], 'Failed creating Alarm Indices mapping!');
  return;
  }
  setTimeout(createKaaeAlarmIndex, 5000);
  tryAlarmCount++;
}


module.exports = {
  createKaaeAlarmIndex: createKaaeAlarmIndex,
  createKaaeIndex: createKaaeIndex,
  tryCreate: tryCreate,
  tryAlarmCreate: tryAlarmCreate
};
