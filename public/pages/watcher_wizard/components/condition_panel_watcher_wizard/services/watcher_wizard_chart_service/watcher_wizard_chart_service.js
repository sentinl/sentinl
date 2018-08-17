import { get } from 'lodash';

class WatcherWizardChartService {
  constructor($http, API, sentinlHelper) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
    this.sentinlHelper = sentinlHelper;
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
      throw new Error(this.sentinlHelper.apiErrMsg(err, `ChartService fetch data for ${queryType}`));
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
