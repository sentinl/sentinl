The [SENTINL anomaly detection](SENTINL-Watcher-Anatomy#anomaly-detection) mechanism is based on [the three-sigma rule of thumb](https://en.wikipedia.org/wiki/68%E2%80%9395%E2%80%9399.7_rule). In short, anomalies are the values which lie outside a band around the mean in a normal distribution with a width of two, four and six standard deviations (68.27%, 95.45% and 99.73%).

Let's do an example. We will take [a credit card dataset](https://www.kaggle.com/dalpozz/creditcardfraud).
 
1. Create a new watcher.
2. In watcher editor, inside `Input` tab insert Elasticsearch query to get the credit card transactions dataset.
```
{
  "search": {
    "request": {
      "index": [
        "credit_card"
      ],
      "body": {
        "size": 10000,
        "query": {
          "bool": {
            "must": [
              {
                "exists": {
                  "field": "Amount"
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

3. In the `Condition` tab specify a minimum number of results to look for `payload.hits.total > 0` and a field name in which to look for anomalies, `Amount` in our example.
```
{
  "script": {
    "script": "payload.hits.total > 0"
  },
  "anomaly": {
    "field_to_check": "Amount"
  }
}
```

4. In `Action` tab create `email html` action. In `Body HTML field` render all the anomalies you have in the `payload.anomaly` using [mustache syntax](https://www.npmjs.com/package/mustache#usage).
```
<h1 style="background-color:DodgerBlue;color:white;padding:5px">Anomalies</h1>
<div style="background-color:Tomato;color:white;padding:5px">
<ul>
{{#payload.anomaly}}
<li><b>id:</b> {{_id}} <b>Amount</b>: {{_source.Amount}}</li>
{{/payload.anomaly}}
</ul>
</div>
```

As a result, we have an email with a list of anomaly transactions.
![](https://user-images.githubusercontent.com/5389745/31390120-5299f1bc-add3-11e7-9ccb-1bb967962acc.png)

Also, the list of anomalies was indexed in today's alert index `watcher_alarms-{year-month-date}`.
![](https://user-images.githubusercontent.com/5389745/31390138-5ece093c-add3-11e7-9790-6255dcb6fc99.png)