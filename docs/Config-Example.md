### SENTINL Configuration: yaml
Sentinl is configured via parameters in the main Kibi _(or kibana)_ yaml file

By default, all actions are disabled and will only produce log entries. To enable one or more actions, configure the required parameters on each, and set the ```active``` flag.


#### Example (minimal)

```yaml
sentinl:
  settings:
    email:
      active: true
      user: smtp_username
      password: smtp_password
      host: smtp.server.com
      ssl: true
    report:
      active: true
      tmp_path: /tmp/
```




#### Example (extended)

```yaml
sentinl:
  es:
    host: localhost
    port: 9200
    timefield: '@timestamp'
    default_index: watcher
    type: sentinl-watcher
    alarm_index: watcher_alarms
    alarm_type: sentinl-alarm
    script_type: sentinl-script
  sentinl:
    history: 20
    results: 50
    scriptResults: 50
  settings:
    email:
      active: false
      user: username
      password: password
      host: smtp.server.com
      ssl: true
      timeout: 10000  # mail server connection timeout
    slack:
      active: false
      username: username
      hook: 'https://hooks.slack.com/services/<token>'
      channel: '#channel'
    webhook:
      active: false
      method: POST
      host: host
      port: 9200
      path: ':/{{payload.watcher_id}}'
      body: '{{payload.watcher_id}}{payload.hits.total}}'
    report:
      active: false
      tmp_path: /tmp/
      search_guard: false
      simple_authentication: false
    pushapps:
      active: false
      api_key: '<pushapps API Key>'  
```
