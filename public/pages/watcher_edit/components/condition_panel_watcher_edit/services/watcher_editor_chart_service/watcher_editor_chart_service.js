class WatcherEditorChartService {
  constructor($http, API, sentinlLog) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
    this.log = sentinlLog;
    this.log.initLocation('WatcherEditorChartService');
  }

  async _query({ queryType = 'count', index = [], over, last, interval, field }) {
    try {
      const uri = this.API[queryType.toUpperCase()];

      return await this.$http.post(uri, {
        es_params: {
          index,
        },
        query_params: {
          over,
          last,
          interval,
          field,
        }
      });
    } catch (err) {
      if (err.status === 503 && err.data.message.includes('index_not_found_exception')) {
        this.log.warn(err.data.message);
      } else {
        throw new Error(`fail to fetch chart data for ${queryType}: ` + err.data.message || err.data.error);
      }
    }
  }

  async count({ index = [], over, last, interval, field }) {
    return this._query({
      queryType: 'count',
      index,
      over,
      last,
      interval,
      field
    });
  }

  async metricAggAverage({ index = [], over, last, interval, field }) {
    return this._query({
      queryType: 'average',
      index,
      over,
      last,
      interval,
      field
    });
  }

  async metricAggSum({ index = [], over, last, interval, field }) {
    return this._query({
      queryType: 'sum',
      index,
      over,
      last,
      interval,
      field
    });
  }

  async metricAggMax({ index = [], over, last, interval, field }) {
    return this._query({
      queryType: 'max',
      index,
      over,
      last,
      interval,
      field
    });
  }

  async metricAggMin({ index = [], over, last, interval, field }) {
    return this._query({
      queryType: 'min',
      index,
      over,
      last,
      interval,
      field
    });
  }
}

export default WatcherEditorChartService;
