# SENTINL Outliers
This example performs a brutal outlier detection against a bucket of detections in one go.

## Super-Basic Outlier Condition (exploded)
```
var match=false; // false by default
payload.offenders = new Array();
payload.detections = new Array();
function detect(data){
   data.sort(function(a,b){return a-b});
   var l = data.length;
   var sum=0;
   var sumsq = 0;
   for(var i=0;i<data.length;++i){ sum+=data[i];sumsq+=data[i]*data[i];}
   var mean = sum/l; 
   var median = data[Math.round(l/2)];
   var LQ = data[Math.round(l/4)];
   var UQ = data[Math.round(3*l/4)];
   var IQR = UQ-LQ;
   for(var i=0;i<data.length;++i){if(!(data[i]> median - 2 * IQR && data[i] < mean + 2 * IQR)){ 
      match=true; payload.detections.push(data[i]); 
   } 
 }
}; 
var countarr=[]; 
payload.aggregations.hits_per_hour.buckets.forEach(function(e){ 
  if(e.doc_count > 1) countarr.push(e.doc_count); 
}); detect(countarr);
payload.aggregations.hits_per_hour.buckets.forEach(function(e){ 
  payload.detections.forEach(function(mat){ 
     if(e.doc_count == mat) payload.offenders.push(e); 
  })
});
match;
```

### Example Sentinl Watcher
```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "anomaly_runner",
  "_score": 1,
  "_source": {
    "uuid": "anomaly_runner",
    "disable": false,
    "trigger": {
      "schedule": {
        "later": "every 30 minutes"
      }
    },
    "input": {
      "search": {
        "request": {
          "body": {
            "size": 0,
            "query": {
              "filtered": {
                "query": {
                  "query_string": {
                    "analyze_wildcard": true,
                    "query": "_type:cdr AND status:8"
                  }
                },
                "filter": {
                  "bool": {
                    "must": [
                      {
                        "range": {
                          "@timestamp": {
                            "gte": "now-1h",
                            "lte": "now"
                          }
                        }
                      }
                    ],
                    "must_not": []
                  }
                }
              }
            },
            "aggs": {
              "hits_per_hour": {
                "date_histogram": {
                  "field": "@timestamp",
                  "interval": "1m",
                  "time_zone": "Europe/Berlin",
                  "min_doc_count": 1
                },
                "aggs": {
                  "top_sources": {
                    "terms": {
                      "field": "source_ip.raw",
                      "size": 5,
                      "order": {
                        "_count": "desc"
                      }
                    }
                  }
                }
              }
            }
          },
          "index": [
            "<pcapture_cdr_*-{now/d}>",
            "<pcapture_cdr_*-{now/d-1d}>"
          ]
        }
      }
    },
    "condition": {
      "script": {
        "script": "payload.detections = new Array();function detect(data){data.sort(function(a,b){return a-b});var l = data.length;var sum=0;var sumsq = 0;for(var i=0;i<data.length;++i){sum+=data[i];sumsq+=data[i]*data[i];}var mean = sum/l; var median = data[Math.round(l/2)];var LQ = data[Math.round(l/4)];var UQ = data[Math.round(3*l/4)];var IQR = UQ-LQ;for(var i=0;i<data.length;++i){if(!(data[i]> median - 2 * IQR && data[i] < mean + 2 * IQR)){ match=true; payload.detections.push(data[i]); } }}; var match=false;var countarr=[]; payload.aggregations.hits_per_hour.buckets.forEach(function(e){ if(e.doc_count > 1) countarr.push(e.doc_count); });detect(countarr);payload.aggregations.hits_per_hour.buckets.forEach(function(e){ payload.detections.forEach(function(mat){ if(e.doc_count == mat) payload.offenders.push(e); })});match;"
      }
    },
    "transform": {},
    "actions": {
      "kibi_actions": {
        "email": {
          "to": "root@localhost",
          "from": "sentinl@localhost",
          "subject": "Series Alarm {{ payload._id}}: User Anomaly {{ payload.detections }} CDRs per Minute",
          "priority": "high",
          "body": "Series Alarm {{ payload._id}}: Anomaly Detected. Possible Offenders: {{#payload.offenders}} \n{{key_as_string}}: {{doc_count}} {{#top_sources.buckets}}\n IP: {{key}} ({{doc_count}} failures) {{/top_sources.buckets}} {{/payload.offenders}} "        }
      }
    }
  }
}
```