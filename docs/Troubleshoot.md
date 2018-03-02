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
### No alert emails
Basic config, kibana.yml:
```
logging.verbose: true
sentinl:
  settings:
    email:
      active: true
      host: beast-cave
      ssl: false
    report:
      active: true
      tmp_path: /tmp/
```
Check your server using some email client, for example `mailx`:
```
mailx -S smtp=<smtp-server-address> -r <from-address> -s <subject> -v <to-address> < body.txt
```  
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

 
