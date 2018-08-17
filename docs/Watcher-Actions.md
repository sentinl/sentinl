### Watcher Actions
__"Actions"__ are executed when a Watcher returns data past its `condition`. 

The following supported __"actions"__ types are available:

#### Email 
Send Query results and message via Email/SMTP
* Requires [action settings](SENTINL-Config-Example) in ```kibana configuration```
```json
"email" : {
  "to" : "root@localhost",
     "from" : "sentinl@localhost",
     "subject" : "Alarm Title",
     "priority" : "high",
     "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
     "stateless" : false
     }
```

#### Email HTML
Send Query results and message via Email/SMTP using HTML body
* Requires  [action settings](SENTINL-Config-Example) in ```kibana configuration```
```json
"email_html" : {
     "to" : "root@localhost",
     "from" : "sentinl@localhost",
     "subject" : "Alarm Title",
     "priority" : "high",
     "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
     "html" : "<p>Series Alarm {{ payload._id}}: {{payload.hits.total}}</p>",
     "stateless" : false
     }
```

#### webHook
Deliver a POST request to a remote web API
```json
   "webhook" : {
     "method" : "POST", 
     "host" : "remote.server", 
     "port" : 9200, 
     "path" : "/{{payload.watcher_id}}", 
     "body" : "{{payload.watcher_id}}:{{payload.hits.total}}"
    }
```

Deliver a GET request to a remote web API
```json
   "webhook" : {
     "method" : "GET", 
     "host" : "remote.server", 
     "port" : 9200, 
     "path" : "/trigger", 
     "params" : {
       "watcher": "{{watcher.title}}",
       "query_count": "{{payload.hits.total}}"
     }
    }
```

#### webHook via Proxy
Deliver message to remote API via Proxy - Telegram example:
```json
 "webhook": {
          "method": "POST",
          "host": "remote.proxy",
          "port": "3128",
          "path": "https://api.telegram.org/bot{botId}/sendMessage",
          "body": "chat_id={chatId}&text=Count+total+hits:%20{{payload.hits.total}}",
          "headers": {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        }
```

#### Slack
Delivery Message to #Slack channel
* Requires  [action settings](SENTINL-Config-Example) in ```kibana configuration``` 
```json
  "slack" : {
     "channel": "#channel",
     "message" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
     "stateless" : false
    }
```
#### Report *(BETA)*
Take a website Snapshot using PhantomJS and send it via Email/SMTP
* Requires  [action settings](SENTINL-Config-Example) in ```kibana configuration```
```json
  "report" : {
    "to" : "root@localhost",
    "from" : "kaae@localhost",
    "subject" : "Report Title",
    "priority" : "high",
    "body" : "Series Report {{ payload._id}}: {{payload.hits.total}}",
    "snapshot" : {
      "res" : "1280x900",
      "url" : "http://127.0.0.1/app/kibana#/dashboard/Alerts",
      "params" : {
        "delay" : 5000,
      }
    },
    "stateless" : false
  }
```

<!--
#### Elasticsearch Index 
Store Query results and message to Elasticsearch index
```json
  "elastic" : {
     "priority" : "medium",
     "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
     }
```
-->

#### Console
Output Query results and message to Console
```json
   "console" : {
    "priority" : "low",
    "message" : "Average {{payload.aggregations.avg.value}}"
    }
```

--------------

##### Storing Payload

By defaults, the original `payload` will not be stored back in Elasticsearch to avoid duplication.
To save the original and modified payload, please add the following option to your action settings:
```
"save_payload" : true
```

Example:
```
   "email" : {
          "to" : "root@localhost",
          "from" : "sentinl@localhost",
          "subject" : "Alarm Title",
          "priority" : "high",
          "body" : "Series Alarm {{ payload._id}}: {{payload.hits.total}}",
          "stateless" : false,
          "save_payload" : true
    }
```
