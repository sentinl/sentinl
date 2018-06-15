/*
* Build Elasticsearch query for watcherEdit chart
*/

class WatcherEditorConditionBuilder {
  constructor() {
  }

  _mathSmbl(word) {
    if (word === 'above') {
      return '>';
    }
    if (word === 'above equal') {
      return '>=';
    }
    if (word === 'below') {
      return '<';
    }
    if (word === 'below equal') {
      return '<=';
    }
  }

  /*
  * @return {string}
    // if (over.type === 'all docs')
    "payload.hits.total > 0"
    // else
    "for(var r=payload.aggregations.bucketAgg.buckets,t=0;t<r.length;t++)if(r[t].doc_count>0)return!0;return!1"
  */
  count({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    const compToThis = this._mathSmbl(threshold.direction) + threshold.n;

    if (over.type === 'all docs') {
      return `payload.hits.total ${compToThis}`;
    }
    return `payload.aggregations.bucketAgg.buckets.some(e => e.doc_count${compToThis})`;
  }

  /*
  * @return {string}
  */
  average({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    return this._metricAggScript({over, threshold});
  }

  /*
  * @return {string}
  */
  sum({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    return this._metricAggScript({over, threshold});
  }

  /*
  * @return {string}
  */
  min({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    return this._metricAggScript({over, threshold});
  }

  /*
  * @return {string}
  */
  max({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    return this._metricAggScript({over, threshold});
  }

  /*
  * @return {string}
    // if (over.type === 'all docs')
    "payload.aggregations.metricAgg.value >0"
    // else
    for(var r=payload.aggregations.bucketAgg.buckets,a=0;a<r.length;a++)if(r[a].metricAgg.value>0)return!0;return!1
  */
  _metricAggScript({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}} = {}) {
    const compToThis = this._mathSmbl(threshold.direction) + threshold.n;

    if (over.type === 'all docs') {
      return `payload.aggregations.metricAgg.value ${compToThis}`;
    }
    return `payload.aggregations.bucketAgg.buckets.some(e => e.metricAgg.value${compToThis})`;
  }
}

export default WatcherEditorConditionBuilder;
