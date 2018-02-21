<img src="https://camo.githubusercontent.com/44ce03256400f1c096ab8e96a22e43508001939b/687474703a2f2f692e696d6775722e636f6d2f7334544b7062462e706e67" width="300"/>

## Watcher Anatomy
A SENTINL watcher is created using the following structure:

##### ➔ Trigger Schedule <br>
>     When and How to run the Watcher
##### ➔ Input Query  <br>
>     What Query or Join Query to Execute
##### ➔ Condition <br>
>     How to conditionally Analyze Response
##### ➔ Transform <br>
>     How to Adapt or Post-Process data
##### ➔ Actions  <br>
>     How to Notify users about this event


   
----------
### Trigger Schedule
The schedule defines a set of constraints that must be met to
execute a saved watcher. Any number of constraints can be
added to a single schedule, and multiple rules can be
combined to achieve complex intervals, programmed using
simple text expressions using the NodeJS later module.

![image](https://user-images.githubusercontent.com/1423657/30432066-cce5edf4-9960-11e7-8269-a3f696441308.png)

Interval exceptions can also be defined as follows:
```
every 2 hours except after 20th hour
```
----------

### Input Query
The input parameter is the key element of a watcher, and
defines a dynamic range index query feeding the circuit.
The input field accepts any standard Elasticsearch query
including server side scripts in supported languages and
fully supports the Siren Join capabilities out of the box.

```json
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
    }
```
----------

### Condition
The condition block is the “entry gate” into the processing pipeline of a Watcher and determines its triggered status. 

* On `true` condition, the pipeline will proceed further.
* On `false` condition, the pipeline will stop (no action will be executed) until its next invocation.

#### Never condition
Use the `never `condition to set the condition to `false`. This means the watch actions are never executed when the watch is triggered. Nevertheless, the watch input is executed. This condition is used for testing. There are no attributes to specify for the `never` condition.
```
condition: {
  "never" : {}
}
```

#### Compare condition
Use the `compare` condition to perform a simple comparison against a value in the watch payload. 
```
condition: {
  "compare" : {
    "payload.hits.total" : { 
      "gte" : 5 
    }
}
```
Comparison operators (apply to numeric, string and date)
<table>
  <tr>
    <th>Name</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>eq</td>
    <td>Returns true when the resolved value equals the given one</td>
  </tr>
  <tr>
    <td>not_eq</td>
    <td>Returns true when the resolved value does not equal the given one</td>
  </tr>
  <tr>
    <td>gt</td>
    <td>Returns true when the resolved value is greater than the given one</td>
  </tr>
  <tr>
    <td>gte</td>
    <td>Returns true when the resolved value is greater/equal than/to the given one</td>
  </tr>
  <tr>
    <td>lt</td>
    <td>Returns true when the resolved value is less than the given one</td>
  </tr>
  <tr>
    <td>lte</td>
    <td>Returns true when the resolved value is less/equal than/to the given one</td>
  </tr>
</table>

#### Array compare condition
Use `array_compare` to compare an array of values. For example, the following array_compare condition returns `true` if there is at least one bucket in the aggregation that has a `doc_count` greater than or equal to 25:
```
"condition": {
  "array_compare": {
    "payload.aggregations.top_amounts.buckets" : { 
      "path": "doc_count" ,
      "gte": { 
        "value": 25, 
      }
    }
  }
}
```
Options
<table>
  <tr>
    <th>Name</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>array.path</td>
    <td>The path to the array in the execution context, specified in dot notation</td>
  </tr>
  <tr>
    <td>array.path.path</td>
    <td>The path to the field in each array element that you want to evaluate</td>
  </tr>
  <tr>
    <td>array.path.operator.quantifier</td>
    <td>How many matches are required for the comparison to evaluate to true: `some` or `all`. Defaults to `some`, there must be at least one match. If the array is empty, the comparison evaluates to false</td>
  </tr>
  <tr>
    <td>array.path.operator.value</td>
    <td>The value to compare against</td>
  </tr>
</table>

#### Script condition
A condition that evaluates a script. The scripting language is **JavaScript**. Can be as simple as a function expecting a boolean condition or counter. 
```
condition: {
  "script": {
    "script": "payload.hits.total > 100"
  }
}
```

Also, it can be as complex as an aggregation parser to filter buckets.
```
condition: {
  "script": {
    "script": "payload.newlist=[];var match=false;var threshold=10;var start_level=2;var finish_level=3;var first=payload.aggregations[start_level.toString()];function loop_on_buckets(element,start,finish,upper_key){element.filter(function(obj){return obj.key;}).forEach( function ( bucket ) { if (start == finish - 1) { if (bucket.doc_count >= threshold) { match=true;payload.newlist.push({line: upper_key + bucket.key + ' ' + bucket.doc_count}); } } else { loop_on_buckets(bucket[start + 1].buckets, start + 1, finish, upper_key + ' ' + bucket.key); } }); } var upper_key = ''; loop_on_buckets(first.buckets, start_level, finish_level, upper_key);match;"
  }
}
```

#### Anomaly detection
Simple anomaly finder based on the [three-sigma rule of thumb](https://en.wikipedia.org/wiki/68%E2%80%9395%E2%80%9399.7_rule).

A. Dynamic detection of outliers/peaks/drops
```
{
  "script": {
    "script": "payload.hits.total > 0"
  },
  "anomaly": {
    "field_to_check": "fieldName"
  }
}
```

B. Static detection for known ranges/interrupts
```
{
  "script": {
    "script": "payload.hits.total > 0"
  },
  "anomaly": {
    "field_to_check": "fieldName",
    "normal_values": [
      5,
      10,
      15,
      20,
      25,
      30
    ]
  }
}
```



#### Range filtering
Use for getting documents which have a value in between some values. For example, get only the documents which have values from 45 to 155 inside `Amount` field.
```
{
  "script": {
    "script": "payload.hits.total > 0"
  },
  "range": {
    "field_to_check": "Amount",
    "min": 50,
    "max": 150,
    "tolerance": 5
  }
}
```


----------

### Transform
A transform processes and changes the payload in the watch execution context to prepare it for the watch actions. No actions executed in case if the payload is empty after transform processing.

#### Search transform
A transform that executes a search on the cluster and replaces the current payload in the watch execution context with the returned search response.
```
"transform": {
  "search": {
    "request": {
      "index": [
        "credit_card"
      ],
      "body": {
        "size": 300,
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "Class": 1
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

#### Script transform
A transform that executes a script (JavaScript) on the current payload and replaces it with a newly generated one. 

Use it for
- converting format types
- generating brand new payload keys 
- interpolating data
- etc.

Create new payload property:
```
"transform": {
  "script": {
    "script": "payload.outliers = payload.aggregations.response_time_outlier.values['95.0']"
  }
}
```

Filter aggregation buckets:
```
"transform": {
  "script": {
    "script": "payload.newlist=[]; payload.payload.aggregations['2'].buckets.filter(function( obj ) { return obj.key; }).forEach(function(bucket){ console.log(bucket.key); if (doc_count.length > 1){ payload.newlist.push({name: bucket.key }); }});"
  }
}
```

#### Chain transform
A transform that executes an ordered list of configured transforms in a chain, where the output of one transform serves as the input of the next transform in the chain.
```
"transform": {
  "chain": [
    {
      "search": {
        "request": {
          "index": [
            "credit_card"
          ],
          "body": {
            "size": 300,
            "query": {
              "bool": {
                "must": [
                  {
                    "match": {
                      "Class": 1
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
    {
      script: {
        script: "payload.hits.total > 100"
      }
    }
  ]
}
```


----------

### Actions
Actions are used to deliver any results obtained by a Watcher to users, APIs or new documents in the cluster.
Multiple Actions and Groups can be defined for each. 

Actions use the ```{{ mustache }}``` logic-less template syntax, and work by iterating arrays and expanding tags in a template using values provided in the response payload.

A dedicated page is available with supported [Actions](SENTINL-Watcher-Actions)

-------

### Full Watcher Example
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
    "transform": {
      "script": {
        "script": "payload.hits.total += 100"
      }
    },
    "actions": {
      "email_admin": {
        "throttle_period": "15m",
        "email": {
          "to": "alarm@localhost",
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


