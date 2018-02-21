

### SENTINL: HIT WATCHER EXAMPLE:

```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "new",
  "_source": {
    "trigger": {
      "schedule": {
        "later": "every 5 minutes"
      }
    },
    "input": {
      "search": {
        "request": {
          "index": [
            "<mos-{now/d}>",
            "<mos-{now/d-1d}>"
          ],
          "body": {}
        }
      }
    },
    "condition": {
      "script": {
        "script": "payload.hits.total > 100"
      }
    },
    "transform": {},
    "actions": {
      "email_admin": {
        "throttle_period": "15m",
        "email": {
          "to": "alarm@localhost",
          "from": "sentinl@localhost",
          "subject": "SENTINL Alarm",
          "priority": "high",
          "body": "Found {{payload.hits.total}} Events"
        }
      },
      "slack_admin": {
        "throttle_period": "15m",
        "slack": {
          "channel": "#kibi",
          "message": "SENTINL Alert! Found {{payload.hits.total}} Events"
        }
      }
    }
  }
}
```


### SENTINL: TRANSFORM EXAMPLE (ES 2.x):
```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "95th",
  "_score": 1,
  "_source": {
    "trigger": {
      "schedule": {
        "later": "every 5 minutes"
      }
    },
    "input": {
      "search": {
        "request": {
          "index": [
            "<access-{now/d}>",
            "<access-{now/d-1d}>"
          ],
          "body": {
            "size": 0,
            "query": {
              "filtered": {
                "query": {
                  "query_string": {
                    "analyze_wildcard": true,
                    "query": "*"
                  }
                },
                "filter": {
                  "range": {
                    "@timestamp": {
                      "from": "now-5m"
                    }
                  }
                }
              }
            },
            "aggs": {
              "response_time_outlier": {
                "percentiles": {
                  "field": "response_time",
                  "percents": [
                    95
                  ]
                }
              }
            }
          }
        }
      }
    },
    "condition": {
      "script": {
        "script": "payload.aggregations.response_time_outlier.values['95.0'] > 200"
      }
    },
    "transform": {
      "script": {
        "script": "payload.myvar = payload.aggregations.response_time_outlier.values['95.0']"
      }
    },
    "actions": {
      "email_admin": {
        "throttle_period": "15m",
        "email": {
          "to": "username@mycompany.com",
          "from": "sentinl@mycompany.com",
          "subject": "SENTINL ALARM {{ payload._id }}",
          "priority": "high",
          "body": "Series Alarm {{ payload._id}}: {{ payload.myvar }}"
        }
      }
    }
  }
}
```

### SENTINL: INSERT BACK TO ELASTIC BULK __(via NGINX or Direct)__
```json
{
 "_index": "watcher",
 "_type": "watch",
 "_id": "surprise",
 "_score": 1,
 "_source": {
   "trigger": {
     "schedule": {
       "later": "every 50 seconds"
     }
   },
   "input": {
     "search": {
       "request": {
         "index": "my-requests-*",
         "body": {
           "query": {
             "filtered": {
               "query": {
                 "query_string": {
                   "query": "*",
                   "analyze_wildcard": true
                 }
               },
               "filter": {
                 "range": {
                   "@timestamp": {
                     "from": "now-5m"
                   }
                 }
               }
             }
           },
           "size": 0,
           "aggs": {
             "metrics": {
               "terms": {
                 "field": "first_url_part"
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
   "transform": {},
   "actions": {
     "ES_bulk_request": {
       "throttle_period": "1m",
       "webhook": {
         "method": "POST",
         "host": "elasticsearch.foo.bar",
         "port": 80,
         "path": ":/_bulk",
         "body": "{{#payload.aggregations.metrics.buckets}}{\"index\":{\"_index\":\"aggregated_requests\", \"_type\":\"data\"}}\n{\"url\":\"{{key}}\", \"count\":\"{{doc_count}}\", \"execution_time\":\"tbd\"}\n{{/payload.aggregations.metrics.buckets}}",
         "headers": {
           "Content-Type": "text/plain; charset=ISO-8859-1"
         },
         "create_alert": true
       }
     }
   }
 }
}
```


<!--
### SENTINL: AGGS WATCHER EXAMPLE:
```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "mos",
  "_score": 1,
  "_source": {
    "trigger": {
      "schedule": {
        "later": "every 5 minutes"
      }
    },
    "input": {
      "search": {
        "request": {
          "indices": [
            "<mos-{now/d}>",
            "<mos-{now/d-1d}>"
          ],
          "body": {
            "query": {
              "filtered": {
                "query": {
                  "query_string": {
                    "query": "mos:*",
                    "analyze_wildcard": true
                  }
                },
                "filter": {
                  "range": {
                    "@timestamp": {
                      "from": "now-5m"
                    }
                  }
                }
              }
            },
            "aggs": {
              "avg": {
                "avg": {
                  "field": "mos"
                }
              }
            }
          }
        }
      }
    },
    "condition": {
      "script": {
        "script": "payload.aggregations.avg.value < 3 && payload.aggregations.avg.value > 0"
      }
    },
    "transform": {
      "search": {
        "request": {
          "indices": [
            "<mos-{now/d}>",
            "<mos-{now/d-1d}>"
          ],
          "body": {
            "query": {
              "filtered": {
                "query_string": {
                  "query": "mos:*",
                  "analyze_wildcard": true
                }
              },
              "filter": {
                "range": {
                  "@timestamp": {
                    "from": "now-1h"
                  }
                }
              }
            }
          },
          "aggs": {
            "avg": {
              "avg": {
                "field": "mos"
              }
            }
          }
        }
      }
    },
    "actions": {
      "email_admin": {
        "throttle_period": "15m",
        "email": {
          "to": "alarm@localhost",
          "subject": "Low MOS Detected: {{payload.aggregations.avg.value}} ",
          "priority": "high",
          "body": "Low MOS Detected:\n {{payload.aggregations.avg.value}} with avg  {{payload.aggregations.count.value}}"
        }
      }
    }
  }
}
```

-->