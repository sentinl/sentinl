# SENTINL Reports
SENTINL watchers can generate snapshots of Kibi, Kibana _(or any other website)_ and deliver them on your schedule using the dedicated ```report``` action, powered by PhantomJS.

So your Boss wants to see some charts each Monday? No problem!

```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "reporter_v8g6p5enz",
  "_score": 1,
  "_source": {
    "trigger": {
      "schedule": {
        "later": "on the first day of the week"
      }
    },
    "report": true,
    "actions": {
      "report_admin": {
        "report": {
          "to": "reports@localhost",
          "from": "sentinl@localhost",
          "subject": "SENTINL Report",
          "priority": "high",
          "body": "Sample SENTINL Screenshot Report",
          "snapshot": {
            "res": "1280x900",
            "url": "http://www.google.com",
            "params": {
              "delay": 5000
            }
          }
        }
      }
    }
  }
}
```

---
#### Requirements
Report actions requires:

* SENTINL 4.5+
* PhantomJS installed on the Kibi/Kibana host, ie: ```npm install phantomjs-prebuilt -g```
* A valid email configuration in ```kibana.yml```, for example:
```
sentinl:
  settings:
    report:
      active: true
      executable_path: '/usr/bin/chromium' # path to Chrome v59+ or Chromium v59+
```

#### Report Away!
With a pinch of luck, you will soon receive your first report with a screenshot attached.

------

##### Common Issues
* ```Unhandled rejection Error: spawn phantomjs ENOENT```
    * PhantomJS is not available to Node-Horseman
