class WatcherEditorChartService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
  }

  async count({ index = [], over, last, interval, field }) {
    try {
      return await this.$http.post(this.API.ALL.COUNT, {
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
      throw new Error(`fail to fetch chart data for count: ${err.data.message}`);
    }
  }

  async metricAggAverage({ index = [], over, last, interval, field }) {
    try {
      return await this.$http.post(this.API.ALL.AVERAGE, {
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
      throw new Error(`fail to fetch chart data for agg average: ${err.data.message}`);
    }
  }

  async metricAggSum({ index = [], over, last, interval, field }) {
    try {
      return await this.$http.post(this.API.ALL.SUM, {
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
      throw new Error(`fail to fetch chart data for agg sum: ${err.data.message}`);
    }
  }

  async metricAggMax({ index = [], over, last, interval, field }) {
    try {
      return await this.$http.post(this.API.ALL.MAX, {
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
      throw new Error(`fail to fetch chart data for agg max: ${err.data.message}`);
    }
  }

  async metricAggMin({ index = [], over, last, interval, field }) {
    try {
      return await this.$http.post(this.API.ALL.MIN, {
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
      throw new Error(`fail to fetch chart data for agg min: ${err.data.message}`);
    }
  }
}

export default WatcherEditorChartService;
