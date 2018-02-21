## SENTINL Nuggets
Random nuggets for recurring challenges

### Dot Field Selection Transform for Percentile objects
```json
 "transform": {
      "script": {
        "script": "payload = JSON.parse(JSON.stringify(payload).split('95.0').join('95'));"
      }
    }
```

### Bucket Cloning
```json
 "transform": {
      "script": {
        "script": "payload.aggregations.metrics.buckets.forEach(function(e){ e.ninetieth_surprise.value = e.ninetieth_surprise.values['95.0'] })"
      }
    }
```
