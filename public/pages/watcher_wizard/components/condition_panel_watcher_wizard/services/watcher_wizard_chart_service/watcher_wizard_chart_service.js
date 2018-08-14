import { get } from 'lodash';

class WatcherWizardChartService {
  constructor($http, API, sentinlLog) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
    this.log = sentinlLog;
    this.log.initLocation('WatcherWizardChartService');
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
      err = get(err, 'data.message') || err.toString();
      if (err.includes('index_not_found_exception')) {
        this.log.warn(err);
      } else {
        throw new Error(`ChartService fetch data for ${queryType}: ` + err);
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

export default WatcherWizardChartService;
