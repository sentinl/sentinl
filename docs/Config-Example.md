### SENTINL Configuration: yaml
Sentinl is configured via parameters in the main Kibi _(or kibana)_ yaml file

By default, all actions are disabled and will only produce log entries. To enable one or more actions, configure the required parameters on each, and set the ```active``` flag.

#### Kibana config for Sentinl v5

##### Example (minimal)

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

##### Example (extended)
```
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
      active: true
      token: 'xoxp-265182-395150-419610-7ba6fb346bcddec9'
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

#### Kibana config for Sentinl v6+

##### Example (minimal)

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
      executable_path: '/usr/bin/chromium' # path to Chrome v59+ or Chromium v59+
```

##### Example (extended)
The commented configuration is optional and are applied by default if not specified otherwise.

```yaml
sentinl:
  es:
    host: 'localhost'
    port: 9200
    # protocol: 'http'
    # results: 50
    # timefield: '@timestamp'
    # default_type: 'doc'
    # alarm_index: 'watcher_alarms'
    # alarm_type: 'sentinl-alarm'
  settings:
    email:
      active: true
      host: 'localhost'
      # user: 'admin'
      # password: 'password'
      # port: 25
      # domain: 'beast.com'
      # ssl: false
      # tls: false
      # authentication: ['PLAIN', 'LOGIN', 'CRAM-MD5', 'XOAUTH2']
      # timeout: 10000  # mail server connection timeout
      # cert:
      #   key: '/full/sys/path/to/key/file'
      #   cert: '/full/sys/path/to/cert/file'
      #   ca: '/full/sys/path/to/ca/file'
    slack:
      active: false
      token: 'xoxp-265182-395150-419610-7ba6fb346bcddec9'
    webhook:
      active: false
      host: 'localhost'
      port: 9200
      # use_https: false
      # path: ':/{{payload.watcher_id}}'
      # body: '{{payload.watcher_id}}{payload.hits.total}}'
      # method: POST
    report:
      # active: true
      # puppeteer:
      #   browser_path: /path/to/chrome
      # horseman:
      #   browser_path: /path/to/phantomjs
```
