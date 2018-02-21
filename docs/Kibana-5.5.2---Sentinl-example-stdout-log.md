```
trex@beast-cave:~/dev/kibi/kibana$ npm start

> kibana@5.5.2 start /home/trex/dev/kibi/kibana
> sh ./bin/kibana --dev

 watching for changes  (476 files)
  log   [13:19:40.562] [info][listening] basePath Proxy running at https://0.0.0.0:5601/ayl
 restarting server  due to changes in "plugins/sentinl/package.json"
 restarting server  due to changes in "plugins/sentinl/README.md"
 restarting server  due to changes in
 - "plugins/sentinl/index.js"
 - "plugins/sentinl/init.js"
 - "plugins/sentinl/server/lib/actions.js"
 - "plugins/sentinl/server/lib/helpers.js"
 - "plugins/sentinl/server/lib/scheduler.js"
 - "plugins/sentinl/server/lib/classes/watcher.js"
 - "plugins/sentinl/server/lib/saved_objects/script.js"
 - "plugins/sentinl/server/lib/saved_objects/user.js"
 - "plugins/sentinl/server/lib/saved_objects/watch.js"
 - "plugins/sentinl/server/lib/validators/anomaly.js"
 - "plugins/sentinl/server/lib/validators/compare.js"
 - "plugins/sentinl/server/lib/validators/compare_array.js"
 - "plugins/sentinl/server/lib/validators/compare_date.js"
 - "plugins/sentinl/server/lib/validators/range.js"
 - "plugins/sentinl/server/mappings/alarm_index.json"
 - "plugins/sentinl/server/mappings/core_index.json"
 - "plugins/sentinl/server/mappings/template.json"
 - "plugins/sentinl/server/mappings/user_index.json"
 - "plugins/sentinl/server/routes/routes.js"
server    log   [13:19:42.926] [debug][plugins] Scanning `/home/trex/dev/kibi/kibana/plugins` for plugins
optmzr    log   [13:19:42.927] [debug][plugins] Scanning `/home/trex/dev/kibi/kibana/plugins` for plugins
server    log   [13:19:42.931] [debug][plugins] Scanning `/home/trex/dev/kibi/kibana/src/core_plugins` for plugins
optmzr    log   [13:19:42.934] [debug][plugins] Scanning `/home/trex/dev/kibi/kibana/src/core_plugins` for plugins
optmzr    log   [13:19:44.217] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/plugins/sentinl/index.js
server    log   [13:19:44.219] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/plugins/sentinl/index.js
server    log   [13:19:44.258] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/console/index.js
optmzr    log   [13:19:44.266] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/console/index.js
optmzr    log   [13:19:44.277] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/dev_mode/index.js
server    log   [13:19:44.284] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/dev_mode/index.js
optmzr    log   [13:19:44.339] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/elasticsearch/index.js
server    log   [13:19:44.346] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/elasticsearch/index.js
optmzr    log   [13:19:44.358] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kbn_doc_views/index.js
server    log   [13:19:44.362] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kbn_doc_views/index.js
optmzr    log   [13:19:44.370] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kbn_vislib_vis_types/index.js
server    log   [13:19:44.379] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kbn_vislib_vis_types/index.js
optmzr    log   [13:19:44.425] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kibana/index.js
server    log   [13:19:44.432] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/kibana/index.js
optmzr    log   [13:19:44.453] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/markdown_vis/index.js
server    log   [13:19:44.461] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/markdown_vis/index.js
optmzr    log   [13:19:44.594] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/metrics/index.js
server    log   [13:19:44.594] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/metrics/index.js
optmzr    log   [13:19:44.608] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/region_map/index.js
server    log   [13:19:44.609] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/region_map/index.js
optmzr    log   [13:19:44.626] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/spy_modes/index.js
server    log   [13:19:44.629] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/spy_modes/index.js
optmzr    log   [13:19:44.648] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/state_session_storage_redirect/in
dex.js
server    log   [13:19:44.650] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/state_session_storage_redirect/in
dex.js
server    log   [13:19:44.670] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/status_page/index.js
optmzr    log   [13:19:44.670] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/status_page/index.js
optmzr    log   [13:19:44.693] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/table_vis/index.js
server    log   [13:19:44.694] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/table_vis/index.js
optmzr    log   [13:19:44.715] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/tagcloud/index.js
server    log   [13:19:44.717] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/tagcloud/index.js
server    log   [13:19:44.762] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/tests_bundle/index.js
optmzr    log   [13:19:44.762] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/tests_bundle/index.js
server    log   [13:19:44.787] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/timelion/index.js
optmzr    log   [13:19:44.789] [debug][plugins] Found plugin at /home/trex/dev/kibi/kibana/src/core_plugins/timelion/index.js
  ops   [13:19:45.087]  memory: 101.7MB uptime: 0:00:08 load: [1.57 1.57 1.51] delay: 1.559
optmzr    log   [13:19:45.254] [info][status][ui settings] Status changed from uninitialized to disabled - uiSettings.enabled config is set t
o `false`
server    log   [13:19:45.275] [info][optimize] Waiting for optimizer completion
optmzr    log   [13:19:45.339] [info][optimize] Lazy optimization of bundles for sentinl, kibana, stateSessionStorageRedirect, timelion, sens
e-tests and status_page ready
optmzr    log   [13:19:45.347] [info] Plugin initialization disabled.
server    log   [13:19:45.355] [debug][plugins] Initializing plugin kibana@kibana
optmzr    log   [13:19:45.368] [info][optimize] Lazy optimization started
server    log   [13:19:45.391] [info][status][plugin:kibana@5.5.2] Status changed from uninitialized to green - Ready
server    log   [13:19:45.393] [debug][plugins] Initializing plugin elasticsearch@kibana
server    log   [13:19:45.478] [info][status][plugin:elasticsearch@5.5.2] Status changed from uninitialized to yellow - Waiting for Elasticse
arch
server    log   [13:19:45.479] [server][uuid][uuid] Resuming persistent Kibana instance UUID: 5b2de169-2785-441b-ae8c-186a1936b17d
server    log   [13:19:45.485] [debug][plugins] Initializing plugin sentinl@5.5.2-SNAPSHOT
server    log   [13:19:45.500] [info][status][plugin:sentinl@5.5.2-SNAPSHOT] Status changed from uninitialized to green - Ready
server    log   [13:19:45.503] [debug][plugins] Initializing plugin console@kibana
server    log   [13:19:45.522] [info][status][plugin:console@5.5.2] Status changed from uninitialized to green - Ready
server    log   [13:19:45.525] [debug][plugins] Initializing plugin dev_mode@kibana
server    log   [13:19:45.528] [debug][plugins] Initializing plugin kbn_doc_views@kibana
server    log   [13:19:45.532] [debug][plugins] Initializing plugin kbn_vislib_vis_types@kibana
server    log   [13:19:45.535] [debug][plugins] Initializing plugin markdown_vis@kibana
server    log   [13:19:45.542] [debug][plugins] Initializing plugin metrics@kibana
server    log   [13:19:45.553] [info][status][plugin:metrics@5.5.2] Status changed from uninitialized to green - Ready
server    log   [13:19:45.555] [debug][plugins] Initializing plugin region_map@kibana
server    log   [13:19:45.561] [debug][plugins] Initializing plugin spy_modes@kibana
server    log   [13:19:45.565] [debug][plugins] Initializing plugin state_session_storage_redirect@kibana
server    log   [13:19:45.568] [debug][plugins] Initializing plugin status_page@kibana
server    log   [13:19:45.574] [debug][plugins] Initializing plugin table_vis@kibana
server    log   [13:19:45.578] [debug][plugins] Initializing plugin tagcloud@kibana
server    log   [13:19:45.586] [debug][plugins] Initializing plugin tests_bundle@kibana
server    log   [13:19:45.594] [debug][plugins] Initializing plugin timelion@kibana
server    log   [13:19:45.907] [debug][plugin] Checking Elasticsearch version
server    log   [13:19:45.911] [info][status][plugin:timelion@5.5.2] Status changed from uninitialized to green - Ready
server    log   [13:19:45.918] [info][listening] Server running at https://0.0.0.0:5603
server    log   [13:19:45.921] [info][status][ui settings] Status changed from uninitialized to yellow - Elasticsearch plugin is yellow
server    log   [13:19:46.158] [info][status][plugin:elasticsearch@5.5.2] Status changed from yellow to green - Kibana index ready
server    log   [13:19:46.161] [info][status][Sentinl] Sentinl Initializing
server    log   [13:19:46.214] [info][status][Sentinl] Checking watcher index ...
server    log   [13:19:46.216] [info][status][Sentinl] Checking watcher index type sentinl-script ...
server    log   [13:19:46.217] [info][status][Sentinl] Checking watcher_alarms index ...
server    log   [13:19:46.221] [info][status][ui settings] Status changed from yellow to green - Ready
server    log   [13:19:46.226] [info][status][Sentinl][report] Phantom installed at /home/trex/dev/kibi/kibana/plugins/sentinl/phantomjs/phan
tomjs-2.1.1-linux-x86_64/bin/phantomjs
server    log   [13:19:46.251] [debug][status][Sentinl] Index watcher exists!
server    log   [13:19:46.275] [debug][status][Sentinl] Index watcher response
server    log   [13:19:46.279] [debug][status][Sentinl] Index watcher_alarms exists!
server    ops   [13:19:47.920]  memory: 90.9MB uptime: 0:00:07 load: [1.57 1.57 1.51] delay: 1.218
optmzr    ops   [13:19:48.475]  memory: 166.5MB uptime: 0:00:07 load: [1.57 1.57 1.51] delay: 454.264
server    log   [13:19:48.728] [debug][plugin] Checking Elasticsearch version
  ops   [13:19:50.087]  memory: 102.0MB uptime: 0:00:13 load: [2.40 1.74 1.57] delay: 0.485
server    log   [13:19:51.281] [debug][plugin] Checking Elasticsearch version
server    ops   [13:19:52.919]  memory: 91.9MB uptime: 0:00:12 load: [2.40 1.74 1.57] delay: 0.290
server    log   [13:19:53.809] [debug][plugin] Checking Elasticsearch version
optmzr    ops   [13:19:54.171]  memory: 219.9MB uptime: 0:00:13 load: [2.40 1.74 1.57] delay: 491.664
  ops   [13:19:55.089]  memory: 102.0MB uptime: 0:00:18 load: [2.29 1.73 1.56] delay: 0.131
server    log   [13:19:55.222] [debug][status][Sentinl][scheduler] Reloading Watchers...
server    log   [13:19:55.223] [debug][status][Sentinl][auth][scheduler] Enabled: false
server    log   [13:19:55.260] [info][status][Sentinl][scheduler] server.sentinlStore.scheduled Watch: yccmk929mma-zbzolg4b9r-9vdj0k4hxv9 eve
ry every 20 mins, every 3 secs
server    log   [13:19:55.262] [info][status][Sentinl][scheduler] server.sentinlStore.scheduled Watch: 6shy6kapqlx-shes2g1zku-5sezrfvvbci eve
ry every 1 mins
server    log   [13:19:55.262] [info][status][Sentinl][scheduler] server.sentinlStore.scheduled Watch: xqxmhjhxihq-hlqnczowo0o-rgxipimxd ever
y every 1 mins
server    log   [13:19:56.336] [debug][plugin] Checking Elasticsearch version
server    ops   [13:19:57.921]  memory: 93.4MB uptime: 0:00:17 load: [2.29 1.73 1.56] delay: 0.249
server    log   [13:19:58.880] [debug][plugin] Checking Elasticsearch version
optmzr    ops   [13:19:59.255]  memory: 437.2MB uptime: 0:00:18 load: [2.29 1.73 1.56] delay: 505.976
server    log   [13:20:00.000] [info][status][Sentinl][scheduler] Executing watcher: xqxmhjhxihq-hlqnczowo0o-rgxipimxd
server    log   [13:20:00.001] [debug][status][Sentinl][scheduler] {
  "_index": "watcher",
  "_type": "sentinl-watcher",
  "_id": "xqxmhjhxihq-hlqnczowo0o-rgxipimxd",
  "_score": 1,
  "_source": {
    "title": "CC",
    "disable": false,
    "report": false,
    "trigger": {
      "schedule": {
        "later": "every 1 mins"
      }
    },
    "input": {
      "search": {
        "request": {
          "index": [
            "credit_card"
          ],
          "body": {
            "size": 3,
            "query": {
              "bool": {
                "must": [
                  {
                    "exists": {
                      "field": "Amount"
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
    "condition": {
      "script": {
        "script": "payload.hits.total > 0"
      }
    },
    "transform": {
      "chain": [
        {
          "search": {
            "request": {
              "index": [
                "credit_card"
              ],
              "body": {
                "size": 3,
                "query": {
                  "bool": {
                    "must": [
                      {
                        "match": {
                          "Class": "1"
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        {
          "script": {
            "script": "payload.double_total = payload.hits.total*2"
          }
        }
      ]
    },
    "actions": {
      "email_admin": {
        "throttle_period": "0h0m1s",
        "email": {
          "to": "sergibondarenko@icloud.com",
          "from": "trex@beast-cave",
          "subject": "CC Alarm",
          "priority": "high",
          "body": "Found {{payload.hits.total}} Events"
        }
      }
    }
  }
}
server    log   [13:20:00.002] [info][status][Sentinl][watcher] Executing action: xqxmhjhxihq-hlqnczowo0o-rgxipimxd
server    log   [13:20:00.004] [debug][status][Sentinl][scheduler] Non-Executing Disabled Watch: 6shy6kapqlx-shes2g1zku-5sezrfvvbci
server    log   [13:20:00.064] [debug][status][Sentinl][watcher] { took: 54,
  timed_out: false,
  _shards: { total: 5, successful: 5, failed: 0 },
  hits:
   { total: 285133,
     max_score: 1,
     hits: [ [Object], [Object], [Object] ] } }
  ops   [13:20:00.097]  memory: 102.1MB uptime: 0:00:23 load: [2.27 1.73 1.57] delay: 0.171
server    log   [13:20:00.135] [info][status][Sentinl] Processing action: email_admin
server    log   [13:20:00.138] [info][status][Sentinl][email] Subject: CC Alarm, Body: Found 492 Events
server    log   [13:20:00.138] [info][status][Sentinl][email] Delivering to Mail Server
server    log   [13:20:00.145] [info][status][Sentinl] Storing Alarm to ES with type: email_admin
server    log   [13:20:00.147] [info][status][Sentinl][watcher] SUCCESS! Watcher has been executed: xqxmhjhxihq-hlqnczowo0o-rgxipimxd.
server    log   [13:20:00.234] [info][status][Sentinl][email] { attachments: [],
  alternative: null,
  header:
   { 'message-id': '<1506432000139.0.11735@beast-cave>',
     date: 'Tue, 26 Sep 2017 15:20:00 +0200',
     from: 'trex@beast-cave',
     to: 'sergibondarenko@icloud.com',
     subject: '=?UTF-8?Q?CC_Alarm?=' },
  content: 'text/plain; charset=utf-8',
  text: 'Found 492 Events' }
server    log   [13:20:00.261] [debug][status][Sentinl][scheduler] Non-Executing Disabled Watch: yccmk929mma-zbzolg4b9r-9vdj0k4hxv9
server    log   [13:20:00.575] [info][status][Sentinl] Alarm stored successfully to ES with type: [email_admin]
server    log   [13:20:01.416] [debug][plugin] Checking Elasticsearch version
server    ops   [13:20:02.923]  memory: 97.3MB uptime: 0:00:22 load: [2.27 1.73 1.57] delay: 0.196
server    log   [13:20:03.261] [debug][status][Sentinl][scheduler] Non-Executing Disabled Watch: yccmk929mma-zbzolg4b9r-9vdj0k4hxv9
```