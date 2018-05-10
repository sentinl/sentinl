import moment from 'moment';
import 'moment-timezone';

/*
* Build Elasticsearch query for watcherEdit chart
*/

class WatcherEditorQueryBuilder {
  constructor({timeFieldName = '@timestamp', timezoneName = 'Europe/Amsterdam'} = {}) {
    this.timeFieldName = timeFieldName;
    this.timezoneName = timezoneName;
  }

  /*
  * @return {object}
    // if (over.type === 'all docs')
    "query": {
      "bool": {
        "filter": {
          "range": {
            "@timestamp": {
              "gte": "{{ctx.trigger.scheduled_time}}||-15m",
              "lte": "{{ctx.trigger.scheduled_time}}",
              "format": "strict_date_optional_time||epoch_millis"
            }
          }
        }
      }
    }
    // else
    "query": {
       "bool": {
         "filter": {
           "range": {
             "@timestamp": {
               "gte": "{{ctx.trigger.scheduled_time}}||-15m",
               "lte": "{{ctx.trigger.scheduled_time}}",
               "format": "strict_date_optional_time||epoch_millis"
             }
           }
         }
       }
     },
     "aggs": {
       "bucketAgg": {
         "terms": {
           "field": "animal.keyword",
           "size": 3,
           "order": {
             "_count": "desc"
           }
         }
       }
     }
  */
  count({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}} = {}) {
    const body = this._epochRange(last.n, last.unit);

    if (over.type === 'all docs') {
      return body;
    }

    body.aggs = this._termsAgg({
      field: over.field,
      size: over.n,
    });
    return body;
  }

  /*
  * @return {object}
    // if (over.type === 'all docs')
    "query": {
      "bool": {
        "filter": {
          "range": {
            "@timestamp": {
              "gte": "{{ctx.trigger.scheduled_time}}||-15m",
              "lte": "{{ctx.trigger.scheduled_time}}",
              "format": "strict_date_optional_time||epoch_millis"
            }
          }
        }
      }
    },
    "aggs": {
      "metricAgg": {
        "avg": {
          "field": "random"
        }
      }
    }
    // else
    "query": {
      "bool": {
        "filter": {
          "range": {
            "@timestamp": {
              "gte": "{{ctx.trigger.scheduled_time}}||-5m",
              "lte": "{{ctx.trigger.scheduled_time}}",
              "format": "strict_date_optional_time||epoch_millis"
            }
          }
        }
      }
    },
    "aggs": {
      "bucketAgg": {
        "terms": {
          "field": "animal.keyword",
          "size": 3,
          "order": {
            "metricAgg": "desc"
          }
        },
        "aggs": {
          "metricAgg": {
            "avg": {
              "field": "random"
            }
          }
        }
      }
    }
  */
  average({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}} = {}) {
    const body = this._epochRange(last.n, last.unit);

    if (over.type === 'all docs') {
      body.aggs = this._metricAggAvg(field);
      return body;
    }

    body.aggs = this._termsAgg({
      field: over.field,
      size: over.n,
    });
    body.aggs.bucketAgg.aggs = this._metricAggAvg(field);
    return body;
  }

  /*
  * @return {object} Elasticsearch query to get sum of 'field' values 'over' a field for 'last' time and in 'interval'
  // if (over.type === 'all docs')
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-30m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "metricAgg": {
      "sum": {
        "field": "random"
      }
    }
  }
  // else
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-30m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "bucketAgg": {
      "terms": {
        "field": "animal.keyword",
        "size": 3,
        "order": {
          "metricAgg": "desc"
        }
      },
      "aggs": {
        "metricAgg": {
          "sum": {
            "field": "random"
          }
        }
      }
    }
  }
  */
  sum({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}} = {}) {
    const body = this._epochRange(last.n, last.unit);

    if (over.type === 'all docs') {
      body.aggs = this._metricAggSum(field);
      return body;
    }

    body.aggs = this._termsAgg({
      field: over.field,
      size: over.n,
    });
    body.aggs.bucketAgg.aggs = this._metricAggSum(field);
    return body;
  }

  /*
  * @return {object} Elasticsearch query to get min of 'field' values 'over' a field for 'last' time and in 'interval'
  // if (over.type === 'all docs')
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-15m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "metricAgg": {
      "min": {
        "field": "random"
      }
    }
  }
  // else
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-15m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "bucketAgg": {
      "terms": {
        "field": "animal.keyword",
        "size": 3,
        "order": {
          "metricAgg": "desc"
        }
      },
      "aggs": {
        "metricAgg": {
          "min": {
            "field": "random"
          }
        }
      }
    }
  }
  */
  min({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}} = {}) {
    const body = this._epochRange(last.n, last.unit);

    if (over.type === 'all docs') {
      body.aggs = this._metricAggMin(field);
      return body;
    }

    body.aggs = this._termsAgg({
      field: over.field,
      size: over.n,
    });
    body.aggs.bucketAgg.aggs = this._metricAggMin(field);
    return body;
  }

  /*
  * @return {object} Elasticsearch query to get max of 'field' values 'over' a field for 'last' time and in 'interval'
  // if (over.type === 'all docs')
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-15m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "metricAgg": {
      "max": {
        "field": "random"
      }
    }
  }
  // else
  "query": {
    "bool": {
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "{{ctx.trigger.scheduled_time}}||-30m",
            "lte": "{{ctx.trigger.scheduled_time}}",
            "format": "strict_date_optional_time||epoch_millis"
          }
        }
      }
    }
  },
  "aggs": {
    "bucketAgg": {
      "terms": {
        "field": "animal.keyword",
        "size": 3,
        "order": {
          "metricAgg": "desc"
        }
      },
      "aggs": {
        "metricAgg": {
          "max": {
            "field": "random"
          }
        }
      }
    }
  }
  */
  max({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}} = {}) {
    const body = this._epochRange(last.n, last.unit);

    if (over.type === 'all docs') {
      body.aggs = this._metricAggMax(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggMax(field);
    }

    return body;
  }

  _epochRange(n, unit) {
    const body = this._range({
      gte: this._epochTimeNUnitsAgo(n, unit),
      lte: this._epochTimeNow(),
    });

    body.size = 0;
    return body;
  }

  _epochTimeNow() {
    return moment.tz(moment().format(), this.timezoneName).valueOf();
  }

  _epochTimeNUnitsAgo(n = 1, unit = 'minutes') {
    return moment.tz(moment().subtract(n, unit).format(), this.timezoneName).valueOf();
  }

  _metricAggSum(field) {
    return {
      metricAgg: {
        sum: {
          field,
        },
      },
    };
  }

  _metricAggAvg(field) {
    return {
      metricAgg: {
        avg: {
          field,
        },
      },
    };
  }

  _metricAggMin(field) {
    return {
      metricAgg: {
        min: {
          field,
        },
      },
    };
  }

  _metricAggMax(field) {
    return {
      metricAgg: {
        max: {
          field,
        },
      },
    };
  }

  _dateAgg({field, interval}) {
    interval = interval.n + interval.unit.substring(0, 1);
    return {
      dateAgg: {
        date_histogram: {
          field: this.timeFieldName,
          time_zone: this.timezoneName,
          interval,
          min_doc_count: 1,
        },
      },
    };
  }

  _termsAgg({field, size, order = 'desc'}) {
    if (!Number.isInteger(+field)) {
      field += '.keyword';
    }

    return {
      bucketAgg: {
        terms: {
          field,
          size,
          order: {
            '_count': order,
          },
        },
      },
    };
  }

  _range({gte, lte, format = 'epoch_millis'}) {
    return {
      query: {
        bool: {
          filter: {
            range: {
              [this.timeFieldName]: {
                gte,
                lte,
                format,
              }
            }
          }
        }
      }
    };
  }
}

export default WatcherEditorQueryBuilder;
