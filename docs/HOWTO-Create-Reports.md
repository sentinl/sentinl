# SENTINL Reports
SENTINL watchers can generate snapshots of Kibi, Kibana _(or any other website)_ and deliver them on your schedule using the dedicated ```report``` action, powered by PhantomJS.

So your Boss wants to see some charts each Monday? No problem!

```json
{
  "actions": {
    "threshold_period": "1s",
    "name": "report",
    "report_admin": {
      "report": {
        "to": "trex@cave",
        "from": "trex@cave",
        "subject": "SENTINL Report",
        "priority": "high",
        "body": "Sample SENTINL Screenshot Report. Total: {{payload.hits.total}}",
        "auth": {
          "username": "admin",
          "password": "password",
          "mode": "searchguard",
          "active": false
        },
        "snapshot": {
          "res": "1280x900",
          "url": "https://localhost:5606/rlt/goto/9c1c53878f54a430b1aef483dcbd091b",
          "type": "png",
          "params": {
            "delay": 20000
          }
        }
      }
    }
  },
  "input": {
    "search": {
      "request": {
        "index": [ "*" ],
        "body": {}
      }
    }
  },
  "condition": {
    "script": {
      "script": "payload.hits.total >= 0"
    }
  },
  "trigger": {
    "schedule": {
      "later": "every 1 minutes"
    }
  },
  "disable": true,
  "report": true,
  "title": "a report",
  "save_payload": false,
  "spy": false,
  "impersonate": false
}
```

---
#### Additional snapshot options
```
{
  "actions": {
    "report_admin": {
      "report": {
        "snapshot": {
          "screenshot_full_page": true,
          "screenshot_type": "png",
          "screenshot_quality": 100,
          "screenshot_clip": {
            "x": 1,
            "y": 1,
            "width": 300,
            "height": 300,
          },
          screenshot_omit_background": false,
          "pdf_landscape": true,
          "pdf_format": "A3",
          "pdf_scale": 1,
          "pdf_display_header_footer": false,
          "pdf_header_template": "<h1>Header</h1>",
          "pdf_footer_template": "<h2>Footer</h2>",
          "pdf_print_background": false,
          "pdf_page_ranges": "1-5, 8",
          "pdf_width": "400px",
          "pdf_height": "600px",
          "pdf_prefer_css_page_size": false,
          "pdf_margin": {
            "top: "20px",
            "right: "10px",
            "bottom: 20px,
            "left: "30px",
          },
...
```
Documentation on the options:
- [pdf](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions)
- [screenshot](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions)

---
#### Requirements
Report actions requires:
* A valid email configuration in ```kibana.yml```

##### Sentinl v5
* PhantomJS installed on the Kibi/Kibana host, ie: ```npm install phantomjs-prebuilt -g```

```
sentinl:
  settings:
    email:
      active: true
      host: localhost
    report:
      active: true
      tmp_path: /tmp
```

##### Sentinl v6
Two report engines are supported: horseman (default) and puppeteer.

```
sentinl:
  settings:
    email:
      active: true
      host: localhost
    report:
      active: true
```

#### Report Away!
With a pinch of luck, you will soon receive your first report with a screenshot attached.

------

##### Common Issues
* ```Unhandled rejection Error: spawn phantomjs ENOENT```
    * PhantomJS is not available to Node-Horseman
