import moment from 'moment';
import 'moment-timezone';

import WatcherEditorQueryBuilder from './watcher_editor_query_builder';

/*
* Build Elasticsearch query for watcherEdit chart
*/

class WatcherEditorChartQueryBuilder extends WatcherEditorQueryBuilder {
  constructor({timeFieldName = '@timestamp', timezoneName = 'Europe/Amsterdam'} = {}) {
    super({timeFieldName, timezoneName});
    this.timeFieldName = timeFieldName;
    this.timezoneName = timezoneName;
  }

  /*
  * @return {object} Elasticsearch query to count documents 'over' a field for 'last' time and in 'interval'
  * if (over.type === 'all docs')
  *   {
  *     "size": 0,
  *     "query": {
  *       "bool": {
  *         "filter": {
  *           "range": {
  *             "@timestamp": {
  *               "gte": 1523621358335,
  *               "lte": 1523625858335,
  *               "format": "epoch_millis"
  *             }
  *           }
  *         }
  *       }
  *     },
  *     "aggs": {
  *       "dateAgg": {
  *         "date_histogram": {
  *           "field": "@timestamp",
  *           "interval": "1m",
  *           "time_zone": "Europe/Berlin",
  *           "min_doc_count": 1
  *         }
  *       }
  *     }
  *   }
  */
  count({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}}) {
    const body = this._epochRange(last.n, last.unit, 0);

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
    }

    return body;
  }

  /*
  * @return {object} Elasticsearch query to get average of 'field' values 'over' a field for 'last' time and in 'interval'
  * if (over.type === 'all docs')
  *   {
  *     "size": 0,
  *     "query": {
  *       "bool": {
  *         "filter": {
  *           "range": {
  *             "@timestamp": {
  *               "gte": 1523624299073,
  *               "lte": 1523628799073,
  *               "format": "epoch_millis"
  *             }
  *           }
  *         }
  *       }
  *     },
  *     "aggs": {
  *       "dateAgg": {
  *         "date_histogram": {
  *           "field": "@timestamp",
  *           "interval": "1m",
  *           "time_zone": "Europe/Berlin",
  *           "min_doc_count": 1
  *         },
  *         "aggs": {
  *           "metricAgg": {
  *             "avg": {
  *               "field": "random"
  *             }
  *           }
  *         }
  *       }
  *     }
  *   }
  */
  average({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}}) {
    const body = this._epochRange(last.n, last.unit, 0);

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
      body.aggs.dateAgg.aggs = this._metricAggAvg(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggAvg(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: this.timeFieldName,
        interval,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggAvg(field);
    }

    return body;
  }

  /*
  * @return {object} Elasticsearch query to get sum of 'field' values 'over' a field for 'last' time and in 'interval'
  * if (over.type === 'all docs')
  *  {
  *    "size": 0,
  *    "query": {
  *      "bool": {
  *        "filter": {
  *          "range": {
  *            "@timestamp": {
  *              "gte": 1523622542336,
  *              "lte": 1523631542336,
  *              "format": "epoch_millis"
  *            }
  *          }
  *        }
  *      }
  *    },
  *    "aggs": {
  *      "dateAgg": {
  *        "date_histogram": {
  *          "field": "@timestamp",
  *          "interval": "5m",
  *          "time_zone": "Europe/Berlin",
  *          "min_doc_count": 1
  *        },
  *        "aggs": {
  *          "metricAgg": {
  *            "sum": {
  *              "field": "random"
  *            }
  *          }
  *        }
  *      }
  *    }
  *  }
  */
  sum({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}}) {
    const body = this._epochRange(last.n, last.unit, 0);

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
      body.aggs.dateAgg.aggs = this._metricAggSum(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggSum(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: this.timeFieldName,
        interval,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggSum(field);
    }

    return body;
  }

  /*
  * @return {object} Elasticsearch query to get min of 'field' values 'over' a field for 'last' time and in 'interval'
  * if (over.type === 'all docs')
  *   {
  *     "size": 0,
  *     "query": {
  *       "bool": {
  *         "filter": {
  *           "range": {
  *             "@timestamp": {
  *               "gte": 1523629565643,
  *               "lte": 1523634065643,
  *               "format": "epoch_millis"
  *             }
  *           }
  *         }
  *       }
  *     },
  *     "aggs": {
  *       "dateAgg": {
  *         "date_histogram": {
  *           "field": "@timestamp",
  *           "interval": "1m",
  *           "time_zone": "Europe/Berlin",
  *           "min_doc_count": 1
  *         },
  *         "aggs": {
  *           "metricAgg": {
  *             "min": {
  *               "field": "random"
  *             }
  *           }
  *         }
  *       }
  *     }
  *   }
  */
  min({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}}) {
    const body = this._epochRange(last.n, last.unit, 0);

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
      body.aggs.dateAgg.aggs = this._metricAggMin(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggMin(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: this.timeFieldName,
        interval,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggMin(field);
    }

    return body;
  }

  /*
  * @return {object} Elasticsearch query to get max of 'field' values 'over' a field for 'last' time and in 'interval'
  * if (over.type === 'all docs')
  *   {
  *     "size": 0,
  *     "query": {
  *       "bool": {
  *         "filter": {
  *           "range": {
  *             "@timestamp": {
  *               "gte": 1523629565643,
  *               "lte": 1523634065643,
  *               "format": "epoch_millis"
  *             }
  *           }
  *         }
  *       }
  *     },
  *     "aggs": {
  *       "dateAgg": {
  *         "date_histogram": {
  *           "field": "@timestamp",
  *           "interval": "1m",
  *           "time_zone": "Europe/Berlin",
  *           "min_doc_count": 1
  *         },
  *         "aggs": {
  *           "metricAgg": {
  *             "max": {
  *               "field": "random"
  *             }
  *           }
  *         }
  *       }
  *     }
  *   }
  */
  max({field = null, over = {type: 'all docs'}, last = {n: 15, unit: 'minutes'}, interval = {n: 1, unit: 'minutes'}}) {
    const body = this._epochRange(last.n, last.unit, 0);

    if (over.type === 'all docs') {
      body.aggs = this._dateAgg({
        field: this.timeFieldName,
        interval,
      });
      body.aggs.dateAgg.aggs = this._metricAggMax(field);
    } else {
      body.aggs = this._termsAgg({
        field: over.field,
        size: over.n,
      });
      body.aggs.bucketAgg.aggs = this._metricAggMax(field);
      body.aggs.bucketAgg.aggs.dateAgg = this._dateAgg({
        field: this.timeFieldName,
        interval,
      }).dateAgg;
      body.aggs.bucketAgg.aggs.dateAgg.aggs = this._metricAggMax(field);
    }

    return body;
  }
}

export default WatcherEditorChartQueryBuilder;
