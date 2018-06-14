class WatcherEditorChartService {
  constructor($http, API, sentinlLog) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
    this.log = sentinlLog;
    this.log.initLocation('WatcherEditorChartService');
  }

  async _query({ queryType = 'count', index = [], query }) {
    try {
      const uri = this.API[queryType.toUpperCase()];

      return await this.$http.post(uri, {
        es_params: {
          index,
        },
        query,
      });
    } catch (err) {
      if (err.status === 503 && err.data.message.includes('index_not_found_exception')) {
        this.log.warn(err.data.message);
      } else {
        throw new Error(`fail to fetch chart data for ${queryType}: ` + err.data.message || err.data.error);
      }
    }
  }

  count({ index = [], query }) {
    return this._query({
      queryType: 'count',
      index,
      query,
    });
  }

  metricAggAverage({ index = [], query }) {
    return this._query({
      queryType: 'average',
      index,
      query,
    });
  }

  metricAggSum({ index = [], query }) {
    return this._query({
      queryType: 'sum',
      index,
      query,
    });
  }

  metricAggMax({ index = [], query }) {
    return this._query({
      queryType: 'max',
      index,
      query,
    });
  }

  metricAggMin({ index = [], query }) {
    return this._query({
      queryType: 'min',
      index,
      query,
    });
  }
}

export default WatcherEditorChartService;
