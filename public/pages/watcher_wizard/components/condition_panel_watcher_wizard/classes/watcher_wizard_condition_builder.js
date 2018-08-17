/*
* Build Elasticsearch query for watcherWizard chart
*/

class WatcherWizardConditionBuilder {
  constructor() {
  }

  _mathSmbl(word) {
    if (word === 'above') {
      return '>';
    }
    if (word === 'above eq') {
      return '>=';
    }
    if (word === 'below') {
      return '<';
    }
    if (word === 'below eq') {
      return '<=';
    }
  }

  /*
  * @return {string}
    // if (over.type === 'all docs')
    "payload.aggregations.dateAgg.buckets.some(b => b.doc_count>1)"
    // else
    "payload.aggregations.bucketAgg.buckets.some(b => b.dateAgg.buckets.some(b => b.doc_count>1))"
  */
  count({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}, filterMethod = 'some'} = {}) {
    const compToThis = this._mathSmbl(threshold.direction) + threshold.n;

    if (over.type === 'all docs') {
      return `payload.aggregations.dateAgg.buckets.${filterMethod}(b => b.doc_count${compToThis})`;
    }
    return `payload.aggregations.bucketAgg.buckets.${filterMethod}(b => b.dateAgg.buckets.${filterMethod}(b => b.doc_count${compToThis}))`;
  }

  /*
  * @return {string}
  */
  average({over, threshold, filterMethod}) {
    return this._metricAgg({over, threshold, filterMethod});
  }

  /*
  * @return {string}
  */
  sum({over, threshold, filterMethod}) {
    return this._metricAgg({over, threshold, filterMethod});
  }

  /*
  * @return {string}
  */
  min({over, threshold, filterMethod}) {
    return this._metricAgg({over, threshold, filterMethod});
  }

  /*
  * @return {string}
  */
  max({over, threshold, filterMethod}) {
    return this._metricAgg({over, threshold, filterMethod});
  }

  /*
  * @return {string}
    // if (over.type === 'all docs')
    "payload.aggregations.dateAgg.buckets.some(b => b.metricAgg.value>1)"
    // else
    "payload.aggregations.bucketAgg.buckets.some(b => b.dateAgg.buckets.some(b => b.metricAgg.value>1))"
  */
  _metricAgg({over = {type: 'all docs'}, threshold = {n: 0, direction: 'above'}, filterMethod = 'some'} = {}) {
    const compToThis = this._mathSmbl(threshold.direction) + threshold.n;

    if (over.type === 'all docs') {
      return `payload.aggregations.dateAgg.buckets.${filterMethod}(b => b.metricAgg.value${compToThis})`;
    }
    return `payload.aggregations.bucketAgg.buckets.${filterMethod}` +
      `(b => b.dateAgg.buckets.${filterMethod}(b => b.metricAgg.value${compToThis}))`;
  }
}

export default WatcherWizardConditionBuilder;
