## Frequently Asked Questions

##### How can I help or contribute?
SENTINL is open-source and anyone can help the project by contributing code, testing, hunting bugs and updating documentation. Not a technical user? Help us by improving documentation, adding examples you find valuable, or just spreading the word about the feature with a blog post, or a tweet promoting the project to potential users.

---

##### Is version 6.x supported?
SENTINL will support all modern versions of Kibana and Elasticsearch. Version 6.x is already available for testing in our releases and will bring a new wave of native integration with Kibana tools, enhancing the experience.

---

##### Emails are not being sent. Why?
SENTINL uses `emailjs` to send emails. This NPM module requires a correct message to be formed, so make sure your configuration includes valid `from` and `to` values, as well as the proper authentication method for your email relay. If in doubt, refer to the [documentation](https://github.com/eleith/emailjs).

---

##### Reports are not being generated. Why?
SENTINL uses either `node-horseman` or `puppeteer` to generate reports. The `node-horseman` NPM module requires PhantomJS to be installed on the system running KaaE and Reports, and `puppeteer` requires Chrome. The default engine used is `puppeteer`, but this can be changed to `horseman` with the `sentinl.settings.report.engine` configuration property.

---

##### Watchers are not running in my timezone. Why?
SENTINL uses the UTC timezone internally to execute schedule. While rolling watchers are not effected _(every x minutes)_ UTC timezone will be used for absolute timed executions. Future versions will allow adapting to localTimezone of the server executing Kibana.

To change the server or container localtime use the following example:
```
###Make a backup
sudo mv /etc/localtime /etc/localtime.bak
### set my localtime
sudo ln -s /usr/share/zoneinfo/XXX/XXX /etc/localtime
```

---

##### How can I avoid string encoding in mustache templates output?
SENTINL uses Mustache to enrich the messages of actions with data from its execution. If you want to use double braces without it being replaced, use triple braces ({{{hello}}}). See the [Mustache documentation](https://mustache.github.io/mustache.5.html) for more information.

---

##### How can I use SENTINL with ReadonlyREST authentication?
When using ReadonlyREST, the following SENTINL exceptions should be added to its configuration:
```
- name: ALLOWPOST
  type: allow
  methods: [POST,HEAD,GET,DELETE,OPTIONS]
  uri_re:  ^/watcher_alarms-.*/
  hosts: [localhost]
  verbosity: info

- name: ALLOWHEAD
  type: allow
  methods: [POST,HEAD,GET,DELETE]
  uri_re:  ^/watcher.*/
  hosts: [localhost]
  verbosity: info
```

---

##### How can I use SENTINL with SearchGuard authentication?
Here's an example provided by our Community to use SENTINL + SearchGuard. [Full demo configuration](HOWTO-Sentinl-and-SearchGuard).
1. Edit the `sg_kibana_server` role in `sg_roles.yml`:
    ```
    sg_kibana_server:
      cluster:
          - CLUSTER_MONITOR
          - CLUSTER_COMPOSITE_OPS
      indices:
        '?kibana':
          '*':
            - INDICES_ALL
        'watcher*':
          '*':
           - MANAGE
           - CREATE_INDEX
           - INDEX
           - READ
           - WRITE
           - DELETE
    ```

2. Reinitialize Search Guard afterwards:
    ```
    plugins/search-guard-5/tools/sgadmin.sh -cd plugins/search-guard-5/sgconfig/ -icl -ts config/truststore.jks -ks config/keystore.jks -h localhost -p 9300 -nhnv
    ```

---

##### Why are prebuilt SENTINL packages so big?
SENTINL packages include PhantomJS and Chrome binaries, occupying most of the archive space. These are used to generate screenshots for reports.

---

##### How can I secure sensitive passwords and values in SENTINL configuration?
When using Kibana 6.1+, the [Secure Settings](https://www.elastic.co/guide/en/kibana/current/secure-settings.html) feature can be used to encrypt sensitive details. For example, to protect an email password:
```
bin/kibana-keystore create
bin/kibana-keystore add sentinl.settings.email.password
```

---

##### Reports failing with "HeadlessError"
When running reports using PhantomJS, the following error might be returned:
```
"fail to report, HeadlessError: Error executing command to extract phantom ports: Error: Command failed: ss -nlp | grep "[,=]354," || netstat -nlp | grep "[[:space:]]354/"\n/bin/sh: ss: command not found
```
This can be resolved by installing the missing `ss` command on your system or container, ie:
```
sudo yum install -y iproute
```

---
