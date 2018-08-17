import moment from 'moment';
import 'moment-timezone';

/*
* Build Elasticsearch query for watcherWizard chart
*/

class WatcherWizardQueryBuilder {
  constructor({timezoneName = 'Europe/Amsterdam'} = {}) {
    this.timezoneName = timezoneName;
  }

  /*
  * @return {object}
  * Query Elasticsearch to get aggregated (by date) data in a specified range. List of buckets is returned with count of docs with a specified field in each bucket.
  // if (type === 'all docs')
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300342000,
                  "lte": 1529596342000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "dateAgg": {
            "date_histogram": {
              "field": "@timestamp",
              "time_zone": "Europe/Amsterdam",
              "interval": "100m",
              "min_doc_count": 1
            }
          }
        }
      }
  // else
  * @return {object}
  * Query Elasticsearch to get aggregated (by field and then by date) data in a specified range. List of buckets is returned with count of docs with a specified field.
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300440000,
                  "lte": 1529596440000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "bucketAgg": {
            "terms": {
              "field": "animal",
              "size": 2,
              "order": {
                "_count": "desc"
              }
            },
            "aggs": {
              "dateAgg": {
                "date_histogram": {
                  "field": "@timestamp",
                  "time_zone": "Europe/Amsterdam",
                  "interval": "100m",
                  "min_doc_count": 1
                }
              }
            }
          }
        }
      }
  */
  count({
    field = null,
    over = {type: 'all docs'},
    last = {n: 15, unit: 'minutes'},
    interval = {n: 1, unit: 'minutes'},
    timeField = '@timestamp'} = {}
  ) {
    const body = this._epochRange({
      n: last.n,
      unit: last.unit,
      timeField,
      bodySize: 0,
    });

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
    }

    return body;
  }

  /*
  * @return {object}
  * Query Elasticsearch to get aggregated (by date) data in a specified range. List of buckets is returned with average values of a specified field.
  // if (type === 'all docs')
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300566000,
                  "lte": 1529596566000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "dateAgg": {
            "date_histogram": {
              "field": "@timestamp",
              "time_zone": "Europe/Amsterdam",
              "interval": "100m",
              "min_doc_count": 1
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
      }
  // else
  * @return {object}
  * Query Elasticsearch to get aggregated (by field and then by date) data in a specified range. List of buckets is returned with average of values of a specified field.
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528301009000,
                  "lte": 1529597009000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "bucketAgg": {
            "terms": {
              "field": "animal",
              "size": 2,
              "order": {
                "_count": "desc"
              }
            },
            "aggs": {
              "metricAgg": {
                "avg": {
                  "field": "random"
                }
              },
              "dateAgg": {
                "date_histogram": {
                  "field": "@timestamp",
                  "time_zone": "Europe/Amsterdam",
                  "interval": "1m",
                  "min_doc_count": 1
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
          }
        }
      }
  */
  average({
    field = null,
    over = {type: 'all docs'},
    last = {n: 15, unit: 'minutes'},
    interval = {n: 1, unit: 'minutes'},
    timeField = '@timestamp'} = {}
  ) {
    const body = this._epochRange({
      n: last.n,
      unit: last.unit,
      timeField,
      bodySize: 0,
    });

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
      body.aggs.dateAgg.aggs = this._metricAggAvg(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggAvg(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggAvg(field);
    }

    return body;
  }

  /*
  * @return {object}
  * Query Elasticsearch to get aggregated (by date) data in a specified range. List of buckets is returned with sum of values of a specified field.
  // if (type === 'all docs')
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300921000,
                  "lte": 1529596921000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "dateAgg": {
            "date_histogram": {
              "field": "@timestamp",
              "time_zone": "Europe/Amsterdam",
              "interval": "1m",
              "min_doc_count": 1
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
      }
  // else
  * @return {object}
  * Query Elasticsearch to get aggregated (by field and then by date) data in a specified range. List of buckets is returned with sum of values of a specified field.
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300962000,
                  "lte": 1529596962000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "bucketAgg": {
            "terms": {
              "field": "animal",
              "size": 2,
              "order": {
                "_count": "desc"
              }
            },
            "aggs": {
              "metricAgg": {
                "sum": {
                  "field": "random"
                }
              },
              "dateAgg": {
                "date_histogram": {
                  "field": "@timestamp",
                  "time_zone": "Europe/Amsterdam",
                  "interval": "1m",
                  "min_doc_count": 1
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
          }
        }
      }
  */
  sum({
    field = null,
    over = {type: 'all docs'},
    last = {n: 15, unit: 'minutes'},
    interval = {n: 1, unit: 'minutes'},
    timeField = '@timestamp'} = {}
  ) {
    const body = this._epochRange({
      n: last.n,
      unit: last.unit,
      timeField,
      bodySize: 0,
    });

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
      body.aggs.dateAgg.aggs = this._metricAggSum(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggSum(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggSum(field);
    }

    return body;
  }

  /*
  * @return {object}
  * Query Elasticsearch to get aggregated (by date) data in a specified range. List of buckets is returned with min of values of a specified field.
  // if (type === 'all docs')
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300770000,
                  "lte": 1529596770000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "dateAgg": {
            "date_histogram": {
              "field": "@timestamp",
              "time_zone": "Europe/Amsterdam",
              "interval": "1m",
              "min_doc_count": 1
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
      }
  // else
  * @return {object}
  * Query Elasticsearch to get aggregated (by field and then by date) data in a specified range. List of buckets is returned with min of values of a specified field.
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300727000,
                  "lte": 1529596727000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "bucketAgg": {
            "terms": {
              "field": "animal",
              "size": 2,
              "order": {
                "_count": "desc"
              }
            },
            "aggs": {
              "metricAgg": {
                "min": {
                  "field": "random"
                }
              },
              "dateAgg": {
                "date_histogram": {
                  "field": "@timestamp",
                  "time_zone": "Europe/Amsterdam",
                  "interval": "1m",
                  "min_doc_count": 1
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
          }
        }
      }
  */
  min({
    field = null,
    over = {type: 'all docs'},
    last = {n: 15, unit: 'minutes'},
    interval = {n: 1, unit: 'minutes'},
    timeField = '@timestamp'} = {}
  ) {
    const body = this._epochRange({
      n: last.n,
      unit: last.unit,
      timeField,
      bodySize: 0,
    });

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
      body.aggs.dateAgg.aggs = this._metricAggMin(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggMin(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggMin(field);
    }

    return body;
  }

  /*
  * @return {object}
  * Query Elasticsearch to get aggregated (by date) data in a specified range. List of buckets is returned with max of values of a specified field.
  // if (type === 'all docs')
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300770000,
                  "lte": 1529596770000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "dateAgg": {
            "date_histogram": {
              "field": "@timestamp",
              "time_zone": "Europe/Amsterdam",
              "interval": "1m",
              "min_doc_count": 1
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
      }
  // else
  * @return {object}
  * Query Elasticsearch to get aggregated (by field and then by date) data in a specified range. List of buckets is returned with max of values of a specified field.
      {
        "query": {
          "bool": {
            "filter": {
              "range": {
                "@timestamp": {
                  "gte": 1528300727000,
                  "lte": 1529596727000,
                  "format": "epoch_millis"
                }
              }
            }
          }
        },
        "size": 0,
        "aggs": {
          "bucketAgg": {
            "terms": {
              "field": "animal",
              "size": 2,
              "order": {
                "_count": "desc"
              }
            },
            "aggs": {
              "metricAgg": {
                "max": {
                  "field": "random"
                }
              },
              "dateAgg": {
                "date_histogram": {
                  "field": "@timestamp",
                  "time_zone": "Europe/Amsterdam",
                  "interval": "1m",
                  "min_doc_count": 1
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
          }
        }
      }
  */
  max({
    field = null,
    over = {type: 'all docs'},
    last = {n: 15, unit: 'minutes'},
    interval = {n: 1, unit: 'minutes'},
    timeField = '@timestamp'} = {}
  ) {
    const body = this._epochRange({
      n: last.n,
      unit: last.unit,
      timeField,
      bodySize: 0,
    });

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      });
      body.aggs.dateAgg.aggs = this._metricAggMax(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggMax(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: timeField,
        interval,
        timeField,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggMax(field);
    }

    return body;
  }

  _epochRange({n, unit, bodySize, timeField}) {
    const body = this._range({
      gte: this._dateMathNUnitsAgo(n, unit),
      lte: this._dateMathNow(unit),
      timeField,
    });

    if (typeof bodySize === 'number') {
      body.size = bodySize;
    }
    return body;
  }

  _dateMathNow(unit) {
    return `now/${unit[0]}`;
  }

  _dateMathNUnitsAgo(n, unit) {
    return `now-${n}${unit[0]}/${unit[0]}`;
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

  _dateAgg({field, interval, timeField}) {
    interval = interval.n + interval.unit.substring(0, 1);
    return {
      dateAgg: {
        date_histogram: {
          field: timeField,
          time_zone: this.timezoneName,
          interval,
          min_doc_count: 1,
        },
      },
    };
  }

  _termsAgg({field, size, order = 'desc'}) {
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

  _range({gte, lte, format = 'epoch_millis', timeField}) {
    return {
      query: {
        bool: {
          filter: {
            range: {
              [timeField]: {
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

export default WatcherWizardQueryBuilder;
