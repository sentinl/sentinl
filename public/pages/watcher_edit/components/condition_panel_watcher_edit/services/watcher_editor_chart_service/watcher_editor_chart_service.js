class WatcherEditorChartService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API.WATCHER_EDIT;
  }

  async countAll({index = [], over, last, interval}) {
    try {
      return await this.$http.post(this.API.ALL.COUNT, {
        es_params: {
          index,
        },
        query_params: {
          over,
          last,
          interval,
        }
      });
    } catch (err) {
      throw new Error(`fail to fetch chart data: ${err.data.message}`);
    }
  }
}

export default WatcherEditorChartService;
