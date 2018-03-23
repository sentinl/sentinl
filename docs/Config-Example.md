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
```




#### Example (extended)
The commented configuration is optional.

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
      username: 'username'
      hook: 'https://hooks.slack.com/services/<token>'
      channel: '#channel'
    webhook:
      active: false
      host: 'localhost'
      port: 9200
      # use_https: false
      # path: ':/{{payload.watcher_id}}'
      # body: '{{payload.watcher_id}}{payload.hits.total}}'
      # method: POST
    report:
      active: true
      timeout: 5000
      # authentication:
      #   enabled: true
      #   mode:
      #     searchguard: false
      #     xpack: false
      #     basic: false
      #     custom: true
      #   custom:
      #     username_input_selector: '#username'
      #     password_input_selector: '#password'
      #     login_btn_selector: '#login-btn'
      # file:
      #   pdf:
      #     format: 'A4'
      #     landscape: true
      #   screenshot:
      #     width: 1280
      #     height: 900
    pushapps:
      active: false
      api_key: '<pushapps API Key>'  
```
