# kaae

> Kibana Alert App for Elasticsearch

---

Proof-of-Concept Kibana4 app & alarm plug-in development based on gitbook:  <http://kibana.logstash.es/content/kibana/v4/plugin/server-develop.html>

#### Dev Installation
<pre>
git clone https://github.com/chenryn/kaae
cd kaae && npm install && npm run package
/opt/kibana/bin/kibana plugin --install kaae -u file://`pwd`/kaae-latest.tar.gz
</pre>

#### Trigger Example
Following the official "watcher" configuration design, create a trigger and action for specific elements:

<pre>
# curl -XPUT http://127.0.0.1:9200/watcher/watch/error_status -d'
{
  "trigger": {
    "schedule" : { "interval" : "60"  }
  },
  "input" : {
    "search" : {
      "request" : {
        "indices" : [ "<logstash-{now/d}>", "<logstash-{now/d-1d}>"  ],
        "body" : {
          "query" : {
            "filtered" : {
              "query" : { "match" : { "host" : "MacBook-Pro"  } },
              "filter" : { "range" : { "@timestamp" : { "from" : "now-5m"  } } }
            }
          }
        }
      }
    }
  },
  "condition" : {
    "script" : {
      "script" : "payload.hits.total > 0"
    }
  },
  "transform" : {
    "search" : {
      "request" : {
        "indices" : [ "<logstash-{now/d}>", "<logstash-{now/d-1d}>"  ],
        "body" : {
          "query" : {
            "filtered" : {
              "query" : { "match" : { "host" : "MacBook-Pro"  } },
              "filter" : { "range" : { "@timestamp" : { "from" : "now-5m"  } } }
            }
          },
          "aggs" : {
            "topn" : {
              "terms" : {
                "field" : "path.raw"
              }
            }
          }
        }
      }
    }
  },
  "actions" : {
    "email_admin" : {
    "throttle_period" : "15m",
    "email" : {
      "to" : "admin@domain",
      "subject" : "Found {{payload.hits.total}} Error Events",
      "priority" : "high",
      "body" : "Top10 paths:\n{{#payload.aggregations.topn.buckets}}\t{{key}} {{doc_count}}\n{{/payload.aggregations.topn.buckets}}"
    }
    }
  }
}'
</pre>



## TODO

- [ ] Real email action.
- [ ] Webpage for editing alert rules.
- [ ] Record alert history into elasticsearch indices.
- [ ] Webpage for history view(maybe use kibana app?).
