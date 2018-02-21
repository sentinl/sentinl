In this example, we will implement the [ATLAS statistical anomaly detector](https://www.elastic.co/blog/implementing-a-statistical-anomaly-detector-part-3) using SENTINL


Our situation:

- We´ve an varnish-cache server as Frontend-LB and caching Proxy
- The backends are selected based on their ```first_url_part```
- Backends are dynamically added or removed by our development teams (even new applications)

If we look at the 95th percentile of our consolidated backend runtimes we can´t see problems of a special backend service. If we draw a graph for every service, it will be to much to see a Problem.

To solve this, we will implement the **atlas** algorithm:

Here is a timelion screeshot of a Loadbalancer Problem:
<img src="https://cloud.githubusercontent.com/assets/1556297/21767347/ea83d052-d673-11e6-8c04-366579500479.png"/>

--------

How to do this? We need two watchers:

* First the one to collect a most surprising ```req_runtime``` of every backend for every hour
* The second watcher iterates every 5 minute over the **atlas** index to find anomalies to report


### First Watcher
This watcher will collect a most surprising ```req_runtime``` of every backend for every hour, and insert any results in the **atlas** index (using ```webhook``` and ```_bulk```)
```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "surprise",
  "_score": 1,
  "_source": {
    "trigger": {
      "schedule": {
        "later": "every 1 hours"
      }
    },
    "input": {
      "search": {
        "request": {
          "index": "public-front-*",
          "body": {
            "query": {
              "filtered": {
                "filter": {
                  "range": {
                    "@timestamp": {
                      "gte": "now-24h"
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
                },
                "aggs": {
                  "queries": {
                    "terms": {
                      "field": "backend"
                    },
                    "aggs": {
                      "series": {
                        "date_histogram": {
                          "field": "@timestamp",
                          "interval": "hour"
                        },
                        "aggs": {
                          "avg": {
                            "avg": {
                              "script": "doc['req_runtime'].value*1000",
                              "lang": "expression"
                            }
                          },
                          "movavg": {
                            "moving_avg": {
                              "buckets_path": "avg",
                              "window": 24,
                              "model": "simple"
                            }
                          },
                          "surprise": {
                            "bucket_script": {
                              "buckets_path": {
                                "avg": "avg",
                                "movavg": "movavg"
                              },
                              "script": {
                                "file": "surprise",
                                "lang": "groovy"
                              }
                            }
                          }
                        }
                      },
                      "largest_surprise": {
                        "max_bucket": {
                          "buckets_path": "series.surprise"
                        }
                      }
                    }
                  },
                  "ninetieth_surprise": {
                    "percentiles_bucket": {
                      "buckets_path": "queries>largest_surprise",
                      "percents": [
                        90.01
                      ]
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
    "transform": {
      "script": {
        "script": "payload.aggregations.metrics.buckets.forEach(function(e){ e.ninetieth_surprise.value = e.ninetieth_surprise.values['90.01']; e.newts = new Date().toJSON(); })"
      }
    },
    "actions": {
      "ES_bulk_request": {
        "throttle_period": "1m",
        "webhook": {
          "method": "POST",
          "host": "myhost",
          "port": 80,
          "path": "/_bulk",
          "body": "{{#payload.aggregations.metrics.buckets}}{\"index\":{\"_index\":\"atlas\", \"_type\":\"data\"}}\n{\"metric\":\"{{key}}\", \"value\":{{ninetieth_surprise.value}}, \"execution_time\":\"{{newts}}\"}\n{{/payload.aggregations.metrics.buckets}}",
          "headers": {
            "content-type": "text/plain; charset=ISO-8859-1"
          }
        }
      }
    }
  }
}
```

The transform script makes the 90th suprise value of every buckes accessible for mustache and generates a NOW timestamp. The action writes the relevant values back to a seperate index named **atlas**.

### Second Watcher
The second watcher iterates every 5 minutes over the **atlas** index to find anomalies to report:

```json
{
  "_index": "watcher",
  "_type": "watch",
  "_id": "check_surprise",
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
          "index": "atlas",
          "body": {
            "query": {
              "filtered": {
                "filter": {
                  "range": {
                    "execution_time": {
                      "gte": "now-6h"
                    }
                  }
                }
              }
            },
            "size": 0,
            "aggs": {
              "metrics": {
                "terms": {
                  "field": "metric"
                },
                "aggs": {
                  "series": {
                    "date_histogram": {
                      "field": "execution_time",
                      "interval": "hour"
                    },
                    "aggs": {
                      "avg": {
                        "avg": {
                          "field": "value"
                        }
                      }
                    }
                  },
                  "series_stats": {
                    "extended_stats": {
                      "field": "value",
                      "sigma": 3
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
        "script": "var status=false;payload.aggregations.metrics.buckets.forEach(function(e){ var std_upper=parseFloat(e.series_stats.std_deviation_bounds.upper); var avg=parseFloat(JSON.stringify(e.series.buckets.slice(-1)[0].avg.value)); if(isNaN(std_upper)||isNaN(avg)) {return status;}; if(avg > std_upper) {status=true; return status;};});status;"
      }
    },
    "transform": {
      "script": {
        "script": "var alerts=[];payload.payload.aggregations.metrics.buckets.forEach(function(e){ var std_upper=parseFloat(e.series_stats.std_deviation_bounds.upper); var avg=parseFloat(JSON.stringify(e.series.buckets.slice(-1)[0].avg.value)); if(isNaN(std_upper)||isNaN(avg)) {return false;}; if(avg > std_upper) {alerts.push(e.key)};}); payload.alerts=alerts"
      }
    },
    "actions": {
      "series_alarm": {
        "throttle_period": "15m",
        "email": {
          "to": "alarms@email.com",
          "from": "sentinl@localhost",
          "subject": "ATLAS ALARM Varnish_first_url_part",
          "priority": "high",
          "body": "there is an alarm for the following Varnish_first_url_parts:{{#alerts}}{{.}}<br>{{/alerts}}"
        }
      }
    }
  }
}
```

The condition script tests whether the average runtime of the last bucket is grater than upper bound of the `` ```std_dev```.

The transform script does something similar an alerts array at the top of the payload.
At the and we alert per email _(or REST POST, etc)_




#### Credits
Thanks to Christian (@cherweg) for contributing his examples for the community