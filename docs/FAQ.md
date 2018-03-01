## Frequently Asked Questions

##### Is SENTINL just a Watcher clone?
SENTINL is not just a Watcher clone per-se, but it does share generic concepts and configuration style with Elastic Watcher to ease the pain of users migrating between the two solutions and could potentially be used to manage Elastic Watcher alerts. 

SENTINL is a Kibana application and its core scheduler runs within the Kibi/Kibana server, controlled with a dedicated UI, while Elastic Watcher is a head-less, Elasticsearch plugin and runs inside of Elasticsearch servers as part of the X-Pack commercial offer _(under a nasty proprietary commercial license under false "free" pretenses to lock-in users)_

SENTINL is truly and completely Open-Source. The Elastic watcher is NOT and appears unsafe to be trusted as Elastic might change their mind again in the future, locking in users to their paid services.

---

##### How can I help or contribute?
SENTINL is Open-Source and anyone can tremendously help the project by contributing code, testing, hunting bugs and extending documentation. Non technical user? Help us by improving documentation, adding examples you find valuable, or just spreading the word about our solutions with a blog post, tweet promoting the project to potential users.

---

##### Is version 6.x supported?
SENTINL will support all modern versions of Kibana and Elasticsearch. Version 6.x is already available for testing in our releases and will bring a new wave of native integration with Kibana tools, enhancing the experience.

---

##### Emails are not being sent - Why?
SENTINL uses the ```emailjs``` npm module to ship out emails. The module requires a correct message formed, so make sure your configuration includes a valid FROM and TO as well as proper authentication method for your mail relay. In case of doubts, please refer to the [documentation](https://github.com/eleith/emailjs)

---

##### Reports are not being generated - Why?
SENTINL uses the ```node-horseman``` npm module to control ```PhantomJS``` at the core of this feature. The module requires ```PhantomJS``` being pre-installed on the system running KaaE and Reports.

---

##### Can I disable a watcher without deleting it?
Sure! Just set watcher parameter ```_source.disable: true``` and SENTINL will bypass it entirely.

---

##### How many concurrent watcher can SENTINL handle?
Sentinl relies on Elasticsearch search thread pool. By default, it is 1000 concurrent requests (if server hardware is powerful enough), also this value can be configured. Thus theoretically, by default, we can support 1000 watchers running at the same time.

---


##### Watchers are not running in my timezone - Why?
SENTINL uses the UTC timezone internally to execute schedule - While rolling watchers are not effected _(every x minutes)_ UTC timezone will be used for absolute timed executions. Future versions will allow adapting to localTimezone of the server executing Kibana/Kibi.

---

##### How can I avoid string encoding in mustache templates output?
When using mustache templates, all variables are HTML escaped by default. If you want to return unescaped HTML, use the triple mustache: {{{name}}}. You can also use & to unescape a variable: {{& name}}. This may be useful when changing delimiters (see [documentation](https://mustache.github.io/mustache.5.html))



---

##### How can I use SENTINL with readonlyRest authentication?
When using ```readonlyRest```, the following SENTINL exceptions should be added to its configuration:
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
Here's an example provided by our Community to use SENTINL + SearchGuard. [Full demo configuration](Sentinl-in-Kibana-Searchguard-5.5.2-demo).

1. Edit the `sg_kibana_server` role in sg_roles.yml:
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

2. Reinitialize Search Guard afterwards, for example 
```
elasticsearch-5.4.0$ ./plugins/search-guard-5/tools/sgadmin.sh -cd plugins/search-guard-5/sgconfig/ -icl -ts config/truststore.jks -ks config/keystore.jks -h localhost -p 9300 -nhnv
```
---

##### Why are prebuilt SENTINL packages so big?
SENTINL prebuilt packages include PhantomJS binaries, occupying most of the archive space.


---


##### How can I secure sensitive passwords and values in SENTINL configuration?
When using Kibana 6.1+ the [Secure Settings](https://www.elastic.co/guide/en/kibana/current/secure-settings.html) feature can be leveraged to encrypt sensitive details. An example to protect the Email password:
```
bin/kibana-keystore create
bin/kibana-keystore add sentinl.settings.email.password
```


---
