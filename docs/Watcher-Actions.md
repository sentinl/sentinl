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
Deliver message to remote web API
```json
   "webhook" : {
	   "method" : "POST", 
	   "host" : "remote.server", 
	   "port" : 9200, 
	   "path": ":/{{payload.watcher_id}}", 
	   "body" : "{{payload.watcher_id}}:{{payload.hits.total}}",
           "create_alert" : true
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
          },
          "create_alert" : true
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
* Requires Pageres/PhantomJS: ```npm install -g pageres```
```json
   "report" : {
	"to" : "root@localhost",
	"from" : "kaae@localhost",
	"subject" : "Report Title",
	"priority" : "high",
	"body" : "Series Report {{ payload._id}}: {{payload.hits.total}}",
	"snapshot" : {
		"res" : "1280,900",
		"url" : "http://127.0.0.1/app/kibana#/dashboard/Alerts",
		"path" : "/tmp/",
		"params" : {
			"username" : "username",
			"password" : "password",
			"delay" : 5000,
			"crop" : false
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
	   "priority" : "DEBUG",
	   "message" : "Avg {{payload.aggregations.avg.value}} measurements in 5 minutes"
	   }
```
-->

#### Console
Output Query results and message to Console
```json
   "console" : {
	  "priority" : "DEBUG",
	  "message" : "Average {{payload.aggregations.avg.value}}"
	  }
```

--------------

By defaults, the original `payload` will not be stored back in Elasticsearch to avoid duplication.
To save the original and modified payload, please add the following option to your action:
```
"save_payload" : true
```
