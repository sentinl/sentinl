# Troubleshooting
This page offers some common problem-solution pairs, dedicated to both new and existing users.

W.I.P - Make sure you also check the [SENTINL FAQ](SENTINL-FAQ)

----------
### Error after Kibana upgrade
Remove Kibana Webpack bundles and restart Kibana.
```
rm -rf kibana/optimize/bundles/*
```
Probably you have some old code build there which causes the error. The bundles will be generated again when you start Kibana. 

----------
### Debug Sentinl
Please ensure you have the following options in kibana.yml:
```
# Enables you specify a file where Kibi stores log output.
logging.dest: stdout

# Set the value of this setting to true to suppress all logging output.
logging.silent: false

# Set the value of this setting to true to suppress all logging output other than error messages.
logging.quiet: false

# Set the value of this setting to true to log all events, including system usage information
# and all requests.
logging.verbose: true
``` 
For example, correct stdout (from Kibana start till watcher execution) is Kibana-5.5.2---Sentinl-example-stdout-log
Notice, all messages which have `Sentinl` in its status are messages related to Sentinl. 

----------
### Security exception while using Search Guard
For example, this message
```
p-f45016r31z8-yok6hzhmmii: [security_exception] no permissions for indices:data/read/search :: {\"path\":\"/logstash-2017.09.22/_search\"    ,\"query\":{},\"body\":\"{}\",\"statusCode\":403,\"response\":\"{\\\"error\\\":{\\\"root_cause\\\":[{\\\"type\\\":\\\"security_exception\    \\",\\\"reason\\\":\\\"no permissions for indices:data/read/search\\\"}],\\\"type\\\":\\\"security_exception\\\",\\\"reason\\\":\\\"no pe    rmissions for indices:data/read/search\\\"},\\\"status\\\":403}\"}"}
```
It says  Sentinl can't read `indices:data/read/search` the `logstash-2017.09.22` index.
Ensure you have the following role for `logstash-*` indices in `sg_roles.yml`:
```
# For the kibana server
sg_kibana_server:
  indices:
    'logstash-*':
      '*':
       - indices:data/read/search

```
Don't forget to apply Search Guard configuration change using `sgadmin.sh`. 

----------
### No alert emails

1. Install and run test email on the Kibana host
```
$ npm install -g maildev
$ maildev
MailDev webapp running at http://0.0.0.0:1080
MailDev SMTP Server running at 0.0.0.0:1025
```

2. Configure Sentinl in kibana.yml
```
sentinl:
  settings:
    email:
      active: true
      host: localhost
      port: 1025
```

3. Restart Kibana

4. Execute watcher

Click on the play icon on the right.
![image](https://user-images.githubusercontent.com/7104356/43213205-f21eaf42-902d-11e8-9919-5a7e2240a05d.png)


4. Check email

Open a browser with URL http://localhost:1080. If you see emails, it means Sentinl sends emails. 
![screenshot from 2018-07-25 17-36-52](https://user-images.githubusercontent.com/5389745/43212438-3dfaba4a-9034-11e8-9aba-eb66327bced7.png)

#### Still no emails using your production email server?
A problem can be in many places: email server misconfigured,  firewall blocks the connection or there is a network issue.

1. Check if your server accepts connection:
```
tcpdump -vv -x -X -s 1500 -i eth1 'port 25'
```
2. Check if your server can send emails:
```
echo "How are you?" | mail -s "Hi, it is me" youremailaddr@gmail.com
```  
