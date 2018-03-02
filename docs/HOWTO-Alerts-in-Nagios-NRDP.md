## Query Aggregations Watcher for Nagios NRDP
In this example we'll configure a SENTINL _(or Elastic)_ Watcher to stream statuses to an extermal **Nagios NRDP** endpoint.

#### 1. Query Request

Let's run an aggregation query in Sense to find low MOS groups in the last 5 minutes interval:

```json
GET _search
{
  "query": {
    "filtered": {
      "query": {
        "query_string": {
          "query": "_type:metrics_calls_total_mos AND tab:mos",
          "analyze_wildcard": true
        }
      },
      "filter": {
        "bool": {
          "must": [
            {
               "range": {
		    "@timestamp": {
		      "gte": "now-5m",
		      "lte": "now"
		    }
		}
            },
	    {
               "range" : {
                 "value" : {
                        "lte" : 3
                 }
               }
            }
          ],
          "must_not": []
        }
      }
    }
  },
  "size": 0,
  "aggs": {
    "mos": {
      "date_histogram": {
        "field": "@timestamp",
        "interval": "30s",
        "time_zone": "Europe/Berlin",
        "min_doc_count": 1
      },
      "aggs": {
        "by_group": {
          "terms": {
            "field": "group.raw",
            "size": 5,
            "order": {
              "_term": "desc"
            }
          },
          "aggs": {
            "avg": {
              "avg": {
                "field": "value"
              }
            }
          }
        }
      }
    }
  }
}
```


#### 2. Query Response

The response should look similar to this example - let's analyze the data structure:

```json
{
  "took": 5202,
  "timed_out": false,
  "_shards": {
    "total": 104,
    "successful": 104,
    "failed": 0
  },
  "hits": {
    "total": 3,
    "max_score": 0,
    "hits": []
  },
  "aggregations": {
    "mos": {
      "buckets": [
        {
          "key_as_string": "2016-08-02T13:41:00.000+02:00",
          "key": 1470138060000,
          "doc_count": 2,
          "by_group": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
              {
                "key": "domain1.com",
                "doc_count": 2,
                "avg": {
                  "value": 1.85
                }
              }
            ]
          }
        },
        {
          "key_as_string": "2016-08-02T13:42:00.000+02:00",
          "key": 1470138120000,
          "doc_count": 1,
          "by_group": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
              {
                "key": "domain2.com",
                "doc_count": 1,
                "avg": {
                  "value": 2.81
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

#### 3. Watcher Query

Next let's use Sense to create a custom SENTINL Watcher based on the query and its response, using ```mustache``` syntax to loop trough the aggregation ```buckets``` and extracting grouped results in an XML structure accepted by Nagios:

```json
PUT _watcher/watch/low_mos
{
  "metadata": {
    "mos threshold": 3
  },
  "trigger": {
    "schedule": {
      "interval": "5m"
    }
  },
  "input": {
    "search": {
      "request": {
        "indices": [
          "<pcapture_*-{now/d}>"
        ],
        "body": {
          "size": 0,
          "query": {
            "filtered": {
              "query": {
                "query_string": {
                  "query": "_type:metrics_calls_total_mos AND tab:mos",
                  "analyze_wildcard": true
                }
              },
              "filter": {
                "bool": {
                  "must": [
                    {
                      "range": {
                        "@timestamp": {
                          "gte": "now-5m",
                          "lte": "now"
                        }
                      }
                    },
                    {
                      "range": {
                        "value": {
                          "lte": 3
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
            "mos": {
              "date_histogram": {
                "field": "@timestamp",
                "interval": "30s",
                "time_zone": "Europe/Berlin",
                "min_doc_count": 1
              },
              "aggs": {
                "by_group": {
                  "terms": {
                    "field": "group.raw",
                    "size": 5,
                    "order": {
                      "_term": "desc"
                    }
                  },
                  "aggs": {
                    "avg": {
                      "avg": {
                        "field": "value"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "condition": {
     "script": {
        "script": "payload.hits.total > 1"
     }
  },
  "actions" : {
  "my_webhook" : {  
    "throttle_period" : "5m", 
    "webhook" : {
      "method" : "POST", 
      "host" : "nagios.domain.ext", 
      "port" : 80, 
      "path": ":/nrdp", 
      "body" : "token=TOKEN&cmd=submitcheck&XMLDATA=<?xml version='1.0'?><checkresults>{{#ctx.payload.aggregations.mos.buckets}} <checkresult type='host' checktype='1'>{{#by_group.buckets}}<hostname>{{key}}</hostname><servicename>MOS</servicename><state>0</state><output>MOS is {{avg.value}}</output> {{/by_group.buckets}}</checkresult>{{/ctx.payload.aggregations.mos.buckets}}</checkresults></xml>" 
    }
  }
}
}
```
##### Action Body (mustache generated)

```xml
<?xml version='1.0'?>
<checkresults>
<checkresult type='host' checktype='1'>
<hostname>domain1.com</hostname><servicename>MOS</servicename><state>0</state><output>MOS is 1.85</output> </checkresult>
<checkresult type='host' checktype='1'>
<hostname>domain2.com</hostname><servicename>MOS</servicename><state>0</state><output>MOS is 2.81</output> </checkresult>
</checkresults>
</xml>
```


#### Mustache Playground
A simple playground simulating the above response and output is available here: http://jsfiddle.net/Lyfoq6yw/

