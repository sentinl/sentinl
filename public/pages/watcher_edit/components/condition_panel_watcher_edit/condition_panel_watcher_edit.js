import './condition_panel_watcher_edit.less';
import template from './condition_panel_watcher_edit.html';

import moment from 'moment';
import {size, has, pick, includes, cloneDeep} from 'lodash';
import WatcherEditorQueryBuilder from './classes/watcher_editor_query_builder';
import WatcherEditorConditionBuilder from './classes/watcher_editor_condition_builder';

class Chart {
  constructor({name = 'all docs', enabled = true, message = '', xAxis = [], yAxis = [[], []], options} = {}) {
    this.name = name;
    this.enabled = enabled;
    this.message = message;
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.options = options || {
      title: {
        display: false,
        text: 'Historical results chart',
      },
    };
  }
}

class ConditionPanelWatcherEdit {
  constructor($http, $scope, watcherEditorChartService, watcherHelper, createNotifier, sentinlLog) {
    this.$http = $http;
    this.$scope = $scope;
    this.watcherEditorChartService = watcherEditorChartService;
    this.helper = watcherHelper;
    this.log = sentinlLog;

    this.locationName = 'ConditionPanelWatcherEdit';
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.queryBuilder = new WatcherEditorQueryBuilder({timeFieldName: '@timestamp', timezoneName: 'Europe/Amsterdam'}); // to-do: get timestamp and timezone from config
    this.conditionBuilder = new WatcherEditorConditionBuilder();

    this.messages = {
      nodata: 'the selected condition does not return any data',
    };

    this.progress = {
      running: false,
      message: 'LOADING DATA ...',
    };

    this.charts = [];

    this.chartQueryParams = {
      queryType: 'count',
      over: { type: 'all docs' },
      last: { n: 15, unit: 'minutes' },
      interval: { n: 1, unit: 'minutes' },
      threshold: { n: 10, direction: 'above' },
    };

    this.queryTypes = {
      count: {},
      metric: ['average', 'min', 'max', 'sum'],
    };

    this.allDocFields = ['animal', 'random']; // to-do: get fields from index docs

    // to-do: update editor when action and title updated
    this.condition = {
      type: {
        handleSelect: (type) => {
          this.log.debug('select type:', type);
          this._updateChartQueryParamsQueryType(type);
        },
      },
      field: {
        enabled: false,
        handleSelect: (field) => {
          this.log.debug('select field:', field);
          this._updateChartQueryParamsField(field);
        },
      },
      over: {
        handleSelect: (over) => {
          this.log.debug('select over:', over);
          if (over.type !== 'top' || !!over.n && !!over.field.length) {
            this._updateChartQueryParamsOver(over);
          }
        },
      },
      threshold: {
        handleSelect: (direction, n) => {
          this.log.debug('select threshold:', direction, n);
          this._updateChartQueryParamsThreshold(n, direction);
          this._drawChartThreshold(this.activeChart, this.chartQueryParams.threshold.n);
        },
      },
      last: {
        handleSelect: (unit, n) => {
          this.log.debug('select last:', unit, n);
          this._updateChartQueryParamsLast(n, unit);
        },
      },
    };

    this.$scope.$watch('conditionPanelWatcherEdit.chartQueryParams', async () => {
      try {
        await this._fetchChartData();
        this._reportStatusToThresholdWatcherEdit();
      } catch (err) {
        this._reportStatusToThresholdWatcherEdit({success: false});
        this.notify.error(`fail: ${err.message}`);
        this.log.error(`fail: ${err.message}`);
      }
    }, true);
  }

  $onInit() {
    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source', () => {
      this._updateChartQueryParamsInterval(this.watcher._source.trigger.schedule.later);
      this.chartQueryParams.index = this.watcher._source.input.search.request.index;

      try {
        this._updateWatcherRawDoc(this.watcher);
      } catch (err) {
        throw new Error(`update watcher raw doc: ${err.message}`);
      }
    }, true);

    this.rawDoc = {
      config: (mode = 'json', maxLines = 30, minLines = 30) => {
        return {
          mode,
          useWrapMode : true,
          showGutter: true,
          rendererOptions: {
            maxLines,
            minLines,
          },
          editorOptions: {
            autoScrollEditorIntoView: false
          },
          // onLoad : () => {}, // to-do: consider persisting changes
          // onChange: () => {},
        };
      },
      watcher: {
        show: false,
        text: JSON.stringify(this.watcher._source, null, 2),
        toggle: () => {
          this.rawDoc.watcher.show = !this.rawDoc.watcher.show;
        },
      },
      chart: {
        show: false,
        text: '{\n"message": "This feaature is under construction. Comming soon ..."\n}',
        toggle: () => {
          this.rawDoc.chart.show = !this.rawDoc.chart.show;
        },
      },
    };
  };

  _updateWatcherRawDoc(watcher) {
    this.rawDoc.watcher.text = JSON.stringify(watcher._source, null, 2);
  }

  get activeChart() {
    return this.charts.find((chart) => chart.enabled === true);
  }

  get isAnyActiveChart() {
    return !!this.charts.find((chart) => chart.enabled === true);
  }

  get isAnyChart() {
    return !!this.charts.length;
  }

  get areMultipleCharts() {
    return this.charts.length > 1;
  }

  _activeChartIndex() {
    return this.charts.findIndex((e) => e.enabled === true);
  }

  _offChartBatch(indicesToExclude = []) {
    this.charts.forEach((chart, i) => {
      if (!indicesToExclude.includes(i)) {
        this._offChart(chart);
      }
    });
  }

  switchToLeftChart() {
    let index = this._activeChartIndex();
    if (index > 0) {
      index -= 1;
      this._offChartBatch([index]);
      this._onChart(this.charts[index]);
    }
  }

  switchToRightChart() {
    let index = this._activeChartIndex();
    if (index < size(this.charts) - 1) {
      index += 1;
      this._offChartBatch([index]);
      this._onChart(this.charts[index]);
    }
  }

  _buildInputQuery({ over, last, interval, field, queryType }) {
    let body;
    switch (queryType) {
      case 'average':
        body = this.queryBuilder.average({ over, last, interval, field });
        this.onQueryChange({ body });
        break;
      case 'sum':
        body = this.queryBuilder.sum({ over, last, interval, field });
        this.onQueryChange({ body });
        break;
      case 'min':
        body = this.queryBuilder.min({ over, last, interval, field });
        this.onQueryChange({ body });
        break;
      case 'max':
        body = this.queryBuilder.max({ over, last, interval, field });
        this.onQueryChange({ body });
        break;
      case 'count':
        body = this.queryBuilder.count({ over, last, interval, field });
        this.onQueryChange({ body });
        break;
      default:
        throw new Error('build query: unknown query type');
    }
  }

  _buildCondition({ over, threshold, queryType }) {
    let condition;
    switch (queryType) {
      case 'average':
        condition = this.conditionBuilder.average({ over, threshold });
        this.onConditionChange({ condition });
        break;
      case 'sum':
        condition = this.conditionBuilder.sum({ over, threshold });
        this.onConditionChange({ condition });
        break;
      case 'min':
        condition = this.conditionBuilder.min({ over, threshold });
        this.onConditionChange({ condition });
        break;
      case 'max':
        condition = this.conditionBuilder.max({ over, threshold });
        this.onConditionChange({ condition });
        break;
      case 'count':
        condition = this.conditionBuilder.count({ over, threshold });
        this.onConditionChange({ condition });
        break;
      default:
        throw new Error('build condition: unknown query type');
    }
  }

  /*
  * Fetch chart data and fill its X and Y axises
  */
  async _fetchChartData() {
    this._toggleConditionBuilderMetricAggOverField();
    const params = pick(this.chartQueryParams, ['index', 'over', 'last', 'interval', 'field', 'threshold', 'queryType']);

    if (this._isMetricAgg(params.queryType)) {
      params.metricAggType = params.queryType;
    }

    if (params.metricAggType) {
      try {
        await this._queryMetricAgg(params);
      } catch (err) {
        throw new Error(`${params.metricAggType}: ${err.message}`);
      }
    } else {
      if (this.chartQueryParams.queryType === 'count') {
        try {
          await this._queryCount(params);
        } catch (err) {
          throw new Error(`count: ${err.message}`);
        }
      }
    }

    if (this.isAnyChart) {
      try {
        this._buildInputQuery(params);
      } catch (err) {
        throw new Error(`build Elasticsearch query: ${err.message}`);
      }

      try {
        this._buildCondition(params);
      } catch (err) {
        throw new Error(`build Elasticsearch query: ${err.message}`);
      }
    }

    return null;
  }

  _isMetricAgg(type) {
    return this.queryTypes.metric.includes(type);
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
  _drawChartThreshold(chart, n) {
    const len = chart.yAxis[0].length;
    chart.yAxis[1] = Array.apply(null, Array(len)).map(Number.prototype.valueOf, n);
  }

  /*
  * @param {string} interval of time: every 1 minutes
  */
  _updateChartQueryParamsInterval(interval) {
    if (this.helper.isScheduleModeEvery(interval)) {
      interval = interval.split(' ');
      this.chartQueryParams.interval = {
        n: +interval[1],
        unit: interval[2],
      };
    }
  }

  _updateChartQueryParamsOver(over) {
    this.chartQueryParams.over = pick(over, ['type', 'n', 'field']);
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

  _isDateAggData(esResp) {
    return has(esResp, 'data.aggregations.dateAgg.buckets') && !!esResp.data.aggregations.dateAgg.buckets.length;
  }

  _isBucketAggData(esResp) {
    return has(esResp, 'data.aggregations.bucketAgg.buckets') && !!esResp.data.aggregations.bucketAgg.buckets.length;
  }

  /**
  * Get matric aggregation (sum, min, max, average) of field
  */
  async _queryMetricAgg({ index, over, last, interval, field, threshold, metricAggType }) {
    this._onProgress();

    try {
      let resp;
      try {
        if (metricAggType === 'average') {
          resp = await this.watcherEditorChartService.metricAggAverage({ index, over, last, interval, field });
        } else if (metricAggType === 'sum') {
          resp = await this.watcherEditorChartService.metricAggSum({ index, over, last, interval, field });
        } else if (metricAggType === 'min') {
          resp = await this.watcherEditorChartService.metricAggMin({ index, over, last, interval, field });
        } else if (metricAggType === 'max') {
          resp = await this.watcherEditorChartService.metricAggMax({ index, over, last, interval, field });
        }
      } catch (err) {
        throw new Error(`query ES: ${err.message}`);
      }

      this.charts = [];
      this.log.debug(`${metricAggType} es resp:`, resp);

      try {
        if (this._isDateAggData(resp)) {
          this.charts.push(new Chart());
          this._updateMetricAggChartWithNewData(this.activeChart, resp.data.aggregations, last, threshold);
          this._onChart(this.activeChart);
        } else if (this._isBucketAggData(resp)) {
          resp.data.aggregations.bucketAgg.buckets.forEach((bucket, i) => {
            this.charts.push(new Chart({enabled: false, name: bucket.key}));
            this._updateMetricAggChartWithNewData(this.charts[i], bucket, last, threshold);
          });
          this._onChart(this.charts[0]);
        } else {
          this._offChart(this.activeChart, this.messages.nodata);
        }
      } catch (err) {
        throw new Error(`update chart data: ${err.message}`);
      }
    } catch (err) {
      this._offChart(this.activeChart, this.messages.nodata);
      this._offProgress();
      throw err;
    }
    this._offProgress();
    return null;
  }

  /**
  * Count documents
  */
  async _queryCount({ index, over, last, interval, field, threshold }) {
    this._onProgress();

    try {
      let resp;
      try {
        resp = await this.watcherEditorChartService.count({ index, over, last, interval, field });
      } catch (err) {
        throw new Error(`query ES: ${err.message}`);
      }

      this.charts = [];
      this.log.debug('count es resp:', resp);

      try {
        if (this._isDateAggData(resp)) {
          this.charts.push(new Chart());
          this._updateCountChartWithNewData(this.activeChart, resp.data.aggregations, last, threshold);
          this._onChart(this.activeChart);
        } else if (this._isBucketAggData(resp)) {
          resp.data.aggregations.bucketAgg.buckets.forEach((bucket, i) => {
            this.charts.push(new Chart({enabled: false, name: bucket.key}));
            this._updateCountChartWithNewData(this.charts[i], bucket, last, threshold);
          });
          this._onChart(this.charts[0]);
        } else {
          this._offChart(this.activeChart, this.messages.nodata);
        }
      } catch (err) {
        throw new Error(`update chart data: ${err.message}`);
      }
    } catch (err) {
      this._offChart(this.activeChart, this.messages.nodata);
      this._offProgress();
      throw err;
    }
    this._offProgress();
    return null;
  }

  _reportStatusToThresholdWatcherEdit({success = true} = {}) {
    const isSuccess = !!this.charts.length && success || false;
    this.updateStatus({ isSuccess });
  }

  _updateCountChartWithNewData(chart, aggs, last, threshold) {
    this._purgeChartData(chart);
    this._updateChartAxisesForCount(chart, aggs, last.unit);
    this._drawChartThreshold(chart, threshold.n);
  }

  _updateMetricAggChartWithNewData(chart, aggs, last, threshold) {
    this._purgeChartData(chart);
    this._updateChartAxisesForMetricAgg(chart, aggs, last.unit);
    this._drawChartThreshold(chart, threshold.n);
  }

  _onProgress(chart, msg) {
    this.progress.message = msg || 'LOADING DATA ...';
    this.progress.running = true;
  }

  _offProgress(chart, msg) {
    this.progress.message = msg || '';
    this.progress.running = false;
  }

  _onChart(chart, msg) {
    if (chart) {
      setTimeout(() => {
        this.$scope.$apply(() => {
          chart.message = msg || '';
          chart.enabled = true;
        });
      });
    }
  }

  _offChart(chart, msg) {
    if (chart) {
      setTimeout(() => {
        this.$scope.$apply(() => {
          chart.message = msg || '';
          chart.enabled = false;
        });
      });
    }
  }

  _updateChartAxisesForCount(chart, aggregations, unit) {
    aggregations.dateAgg.buckets.forEach((bucket) => {
      chart.xAxis.push(this._formatTimeForXAxis(bucket.key, unit));
      chart.yAxis[0].push(bucket.doc_count);
    });
  }

  _updateChartAxisesForMetricAgg(chart, aggregations, unit) {
    aggregations.dateAgg.buckets.forEach((bucket) => {
      chart.xAxis.push(this._formatTimeForXAxis(bucket.key, unit));
      chart.yAxis[0].push(bucket.metricAgg.value);
    });
  }

  _purgeChartData(chart) {
    chart.xAxis = [];
    chart.yAxis[0] = [];
  }

  _purgeAllCharts() {
    this.charts = [];
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
}

function conditionPanelWatcherEdit() {
  return {
    template,
    restrict: 'E',
    scope: {
      watcher: '<',
      updateStatus: '&',
      onTrigger: '=',
      onQueryChange: '&',
      onConditionChange: '&',
    },
    controller:  ConditionPanelWatcherEdit,
    controllerAs: 'conditionPanelWatcherEdit',
    bindToController: true,
  };
}

export default conditionPanelWatcherEdit;
