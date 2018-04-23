import './condition_panel_watcher_edit.less';
import template from './condition_panel_watcher_edit.html';

import moment from 'moment';
import {has, pick, includes} from 'lodash';

class ConditionPanelWatcherEdit {
  constructor($http, $log, $scope, watcherEditorChartService) {
    this.$http = $http;
    this.$log = $log;
    this.$scope = $scope;
    this.watcherEditorChartService = watcherEditorChartService;

    this.messages = {
      nodata: 'the selected condition does not return any data',
    };

    this.chart = {
      enabled: true,
      message: '',
      xAxis: [],
      yAxis: [[], []],
      options: {
        title: {
          display: false,
          text: 'Historical results chart'
        },
      },
      progress: {
        running: false,
        message: 'LOADING DATA ...',
      },
    };

    this.chartQueryParams = {
      index: ['watcher_aggs_test'],
      // index: watcher._source.search.request.index,
      queryType: 'count',
      over: { type: 'all docs' },
      last: { n: 15, unit: 'minutes' },
      interval: { n: 1, unit: 'minutes' },
      threshold: { n: 10, direction: 'above' },
    };

    this.allDocFields = ['random'];

    this.condition = {
      type: {
        handleSelect: (type) => {
          this.$log.debug('select type:', type);
          this._updateChartQueryParamsQueryType(type);
        },
      },
      field: {
        enabled: false,
        handleSelect: (field) => {
          this.$log.debug('select field:', field);
          this._updateChartQueryParamsField(field);
        },
      },
      over: {
        handleSelect: (over) => {
          this.$log.debug('select over:', over);
        },
      },
      threshold: {
        handleSelect: (direction, n) => {
          this.$log.debug('select threshold:', direction, n);
          this._updateChartQueryParamsThreshold(n, direction);
          this._drawChartThreshold(this.chartQueryParams.threshold.n);
        },
      },
      last: {
        handleSelect: (unit, n) => {
          this.$log.debug('select last:', unit, n);
          this._updateChartQueryParamsLast(n, unit);
        },
      },
    };

    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source.trigger.schedule.later', () => {
      this._updateChartQueryParamsInterval(this.watcher._source.trigger.schedule.later);
    });

    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source.input.search.request.index', () => {
      // this.chartQueryParams.index = this.watcher._source.input.search.request.index;
    });

    this.$scope.$watch('conditionPanelWatcherEdit.chartQueryParams', () => {
      this._fetchChartData();
    }, true);
  }

  /*
  * Fetch chart data and fill its X and Y axises
  */
  _fetchChartData() {
    this._toggleConditionBuilderMetricAggOverField();
    const params = pick(this.chartQueryParams, ['index', 'over', 'last', 'interval', 'field']);

    if (this.chartQueryParams.queryType === 'average') {
      params.metricAggType = 'average';
      this._queryMetricAgg(params);
      return;
    }

    if (this.chartQueryParams.queryType === 'sum') {
      params.metricAggType = 'sum';
      this._queryMetricAgg(params);
      return;
    }

    if (this.chartQueryParams.queryType === 'min') {
      params.metricAggType = 'min';
      this._queryMetricAgg(params);
      return;
    }

    if (this.chartQueryParams.queryType === 'max') {
      params.metricAggType = 'max';
      this._queryMetricAgg(params);
      return;
    }

    this._queryCount(params);
  }

  _toggleConditionBuilderMetricAggOverField() {
    if (this.chartQueryParams.queryType === 'count') {
      this.condition.field.enabled = false;
    } else {
      this.condition.field.enabled = true;
    }
  }

  /*
  * @param {integer} n on y axis
  */
  _drawChartThreshold(n) {
    const len = this.chart.yAxis[0].length;
    this.chart.yAxis[1] = Array.apply(null, Array(len)).map(Number.prototype.valueOf, n);
  }

  /*
  * @param {string} interval of time: every 1 minutes
  */
  _scheduleModeEveryIsUsed(interval) {
    if (interval.match(/every \d+ (seconds|minutes|hours|days|months|years)/g)) {
      return true;
    }
    return false;
  }

  /*
  * @param {string} interval of time: every 1 minutes
  */
  _updateChartQueryParamsInterval(interval) {
    if (this._scheduleModeEveryIsUsed(interval)) {
      interval = interval.split(' ');
      this.chartQueryParams.interval = {
        n: +interval[1],
        unit: interval[2],
      };
    }
  }

  _updateChartQueryParamsField(field) {
    this.chartQueryParams.field = field;
  }

  _updateChartQueryParamsQueryType(type) {
    this.chartQueryParams.queryType = type;
  }

  _updateChartQueryParamsLast(n, unit) {
    this.chartQueryParams.last = { unit, n: +n };
  }

  _updateChartQueryParamsThreshold(n, direction) {
    this.chartQueryParams.threshold = { direction, n: +n };
  }

  /**
  * Get matric aggregation (sum, min, max, average) of field
  */
  async _queryMetricAgg({ index, over, last, interval, field, metricAggType }) {
    this._onProgress();
    try {
      let resp;
      if (metricAggType === 'average') {
        resp = await this.watcherEditorChartService.metricAggAverage({ index, over, last, interval, field });
      } else if (metricAggType === 'sum') {
        resp = await this.watcherEditorChartService.metricAggSum({ index, over, last, interval, field });
      } else if (metricAggType === 'min') {
        resp = await this.watcherEditorChartService.metricAggMin({ index, over, last, interval, field });
      } else if (metricAggType === 'max') {
        resp = await this.watcherEditorChartService.metricAggMax({ index, over, last, interval, field });
      }

      this._purgeChartData();

      if (has(resp, 'data.aggregations.dateAgg.buckets')) {
        if (!resp.data.aggregations.dateAgg.buckets.length) {
          this._offChart(this.messages.nodata);
        } else {
          this._updateChartAxisesForMetricAgg(resp.data.aggregations, last);
          this._drawChartThreshold(this.chartQueryParams.threshold.n);
          this._onChart();
        }
      } else {
        this._offChart(this.messages.nodata);
      }
      this.$log.debug(`${metricAggType} all resp:`, resp);
    } catch (err) {
      this.$log.error(`fail to count all: ${err.message}`);
      this._offChart(this.messages.nodata);
    }
    this._offProgress();
  }

  /**
  * Count documents
  */
  async _queryCount({ index, over, last, interval, field }) {
    this._onProgress();
    try {
      const resp = await this.watcherEditorChartService.count({ index, over, last, interval, field });
      this._purgeChartData();

      if (has(resp, 'data.aggregations.dateAgg.buckets')) {
        if (!resp.data.aggregations.dateAgg.buckets.length) {
          this._offChart(this.messages.nodata);
        } else {
          this._updateChartAxisesForCount(resp.data.aggregations, last);
          this._drawChartThreshold(this.chartQueryParams.threshold.n);
          this._onChart();
        }
      } else {
        this._offChart(this.messages.nodata);
      }
      this.$log.debug('COUNT all resp:', resp);
    } catch (err) {
      this.$log.error(`fail to count all: ${err.message}`);
      this._offChart(this.messages.nodata);
    }
    this._offProgress();
  }

  _onProgress(msg) {
    this.chart.progress.message = msg || 'LOADING DATA ...';
    this.chart.progress.running = true;
  }

  _offProgress(msg) {
    this.chart.progress.message = msg || 'LOADING DATA ...';
    this.chart.progress.running = false;
  }

  _onChart(msg) {
    this.$scope.$apply(() => {
      this.chart.message = msg || '';
      this.chart.enabled = true;
    });
  }

  _offChart(msg) {
    this.$scope.$apply(() => {
      this.chart.message = msg || '';
      this.chart.enabled = false;
    });
  }

  _updateChartAxisesForCount(aggregations, last) {
    aggregations.dateAgg.buckets.forEach((bucket) => {
      this.chart.xAxis.push(this._formatTimeForXAxis(bucket.key, last.unit));
      this.chart.yAxis[0].push(bucket.doc_count);
    });
  }

  _updateChartAxisesForMetricAgg(aggregations, last) {
    aggregations.dateAgg.buckets.forEach((bucket) => {
      this.chart.xAxis.push(this._formatTimeForXAxis(bucket.key, last.unit));
      this.chart.yAxis[0].push(bucket.metricAgg.value);
    });
  }

  _purgeChartData() {
    this.chart.xAxis = [];
    this.chart.yAxis[0] = [];
  }

  /*
  * @return {string} formatted time - April 18, 2018 4:58 PM
  */
  _formatTimeForXAxis(epochTime, unit) {
    let locale = 'LLL';
    if (unit === 'seconds') {
      locale = 'LTS';
    }
    if (unit === 'minutes' || unit === 'hours') {
      locale = 'LT';
    }
    if (unit === 'days' || unit === 'months' || unit === 'years') {
      locale = 'L';
    }
    return moment(epochTime).format(locale);
  }

  _onChartClick() {
    console.log('chart clicked');
  }
}

function conditionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '=watcher',
    },
    controller:  ConditionPanelWatcherEdit,
    controllerAs: 'conditionPanelWatcherEdit',
    bindToController: true,
  };
}

export default conditionPanelWatcherEdit;
