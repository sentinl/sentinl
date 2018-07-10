import './condition_panel_watcher_edit.less';
import template from './condition_panel_watcher_edit.html';

import moment from 'moment';
import {forEach, size, has, pick, includes} from 'lodash';
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
  constructor($http, $scope, watcherEditorChartService, createNotifier, sentinlLog, ServerConfig, wizardHelper) {
    this.$scope = $scope;
    this.watcher = this.watcher || this.$scope.watcher;
    this.updateStatus = this.updateStatus || this.$scope.updateStatus;
    this.onQueryChange = this.onQueryChange || this.$scope.onQueryChange;
    this.onConditionChange = this.onConditionChange || this.$scope.onConditionChange;
    this.aceOptions = this.aceOptions || this.$scope.aceOptions;
    this.indexesData = this.indexesData || this.$scope.indexesData;
    this.turnIntoAdvanced = this.turnIntoAdvanced || this.$scope.turnIntoAdvanced;
    this.errorMessage = this.errorMessage || this.$scope.errorMessage;

    this.$http = $http;
    this.watcherEditorChartService = watcherEditorChartService;
    this.serverConfig = ServerConfig;
    this.wizardHelper = wizardHelper;
    this.log = sentinlLog;

    this.locationName = 'ConditionPanelWatcherEdit';
    this.log.initLocation(this.locationName);
    this.notify = createNotifier({
      location: this.locationName,
    });

    this.messages = {
      nodata: 'the selected condition does not return any data',
    };

    this.progress = {
      running: false,
      message: 'LOADING DATA ...',
    };

    this.charts = [];
    this.chartQuery;

    this.queryTypes = {
      count: {},
      metric: ['average', 'min', 'max', 'sum'],
    };

    if (!this.wizardHelper.isWizardWatcher(this.watcher)) {
      this.watcher._source.wizard = {
        chart_query_params: {
          timeField: '@timestamp',
          queryType: 'count',
          scheduleType: 'every', // options: every, human
          over: { type: 'all docs' },
          last: { n: 15, unit: 'minutes' },
          interval: { n: 1, unit: 'minutes' },
          threshold: this._getThreshold(this.watcher),
        }
      };
    }

    this.condition = {
      textLimit: 7,
      type: {
        handleSelect: (type) => {
          this.log.debug('select type:', type);
          this._updateChartQueryParamsQueryType(type);
        },
      },
      field: {
        aggEnabled: false,
        handleFieldSelect: (field) => {
          this.log.debug('select field:', field);
          this.watcher._source.wizard.chart_query_params.field = field;
        },
        handleTimeFieldSelect: (timeField) => {
          this.log.debug('select time field:', timeField);
          this.watcher._source.wizard.chart_query_params.timeField = timeField;
        },
      },
      over: {
        handleSelect: (over) => {
          this.log.debug('select over:', over);
          if (over.type !== 'top' || !!over.n && (over.field && !!over.field.length)) {
            this._updateChartQueryParamsOver(over);
          }
        },
      },
      threshold: {
        handleSelect: (direction, n) => {
          this.log.debug('select threshold:', direction, n);
          this._updateChartQueryParamsThreshold(n, direction);
          this._drawChartThreshold(this.activeChart, this.watcher._source.wizard.chart_query_params.threshold.n);
        },
      },
      last: {
        handleSelect: (unit, n) => {
          this.log.debug('select last:', unit, n);
          this._updateChartQueryParamsLast(n, unit);
        },
      },
      interval: {
        handleSelect: (unit, n) => {
          this.log.debug('select interval:', unit, n);
          this._updateChartQueryParamsInterval(n, unit);
        },
      },
    };

    this.content = {
      views: {
        chart: {
          show: true,
        },
        chartquery: {
          show: false,
        },
        watcherquery: {
          show: false,
        },
      },
      toggle: (view) => {
        this.content.views[view].show = !this.content.views[view].show;
        if (!this.content.views[view].show) {
          this.content.views.chart.show = true;
        } else {
          forEach(this.content.views, function (settings, viewName) {
            if (view !== viewName) {
              settings.show = false;
            }
          });
        }
      },
    };

    this.rawDoc = {
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

    this._init();
  }

  async _init() {
    const config = await this.serverConfig.get();
    this.queryBuilder = new WatcherEditorQueryBuilder({timezoneName: config.data.es.timezone});
    this.conditionBuilder = new WatcherEditorConditionBuilder();

    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source', async () => {
      if (has(this.watcher, '_source.trigger.schedule.later')) {
        this.watcher._source.wizard.chart_query_params.index = this.watcher._source.input.search.request.index;

        try {
          await this._fetchChartData();
          this._updateWatcherRawDoc(this.watcher);
          this._updateChartRawDoc(this.chartQuery);
          this._reportStatusToThresholdWatcherEdit();
        } catch (err) {
          this.errorMessage({err});
          this._reportStatusToThresholdWatcherEdit({success: false});
        }
      }
    }, true);
  }

  _warning(msg) {
    msg = msg.replace(/fail/ig, '[warning]');
    this.log.warn(msg);
    this.notify.warning(msg);
  }

  _error(msg) {
    this.log.error(msg);
    this.notify.error(msg);
  }

  _getThreshold(watcher) {
    const condition = /(>=|<=|<|>)\s?(\d+)/.exec(watcher._source.condition.script.script);
    if (condition[1] === '<') {
      return {n: +condition[2], direction: 'below'};
    }
    if (condition[1] === '>') {
      return {n: +condition[2], direction: 'above'};
    }
    if (condition[1] === '<=') {
      return {n: +condition[2], direction: 'below eq'};
    }
    if (condition[1] === '>=') {
      return {n: +condition[2], direction: 'above eq'};
    }
  }

  _updateWatcherRawDoc(watcher) {
    this.rawDoc.watcher.text = JSON.stringify(watcher._source, null, 2);
  }

  _updateChartRawDoc(chartQuery) {
    this.rawDoc.chart.text = JSON.stringify(chartQuery, null, 2);
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

  _buildInputQuery({ over, last, interval, field, queryType, timeField }) {
    let body;
    switch (queryType) {
      case 'average':
        body = this.queryBuilder.average({ over, last, interval, field, timeField });
        this.onQueryChange({ body });
        break;
      case 'sum':
        body = this.queryBuilder.sum({ over, last, interval, field, timeField });
        this.onQueryChange({ body });
        break;
      case 'min':
        body = this.queryBuilder.min({ over, last, interval, field, timeField });
        this.onQueryChange({ body });
        break;
      case 'max':
        body = this.queryBuilder.max({ over, last, interval, field, timeField });
        this.onQueryChange({ body });
        break;
      case 'count':
        body = this.queryBuilder.count({ over, last, interval, field, timeField });
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
    const params = pick(this.watcher._source.wizard.chart_query_params,
      ['index', 'over', 'last', 'interval', 'field', 'threshold', 'queryType', 'timeField']);

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
      if (this.watcher._source.wizard.chart_query_params.queryType === 'count') {
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
    if (this.watcher._source.wizard.chart_query_params.queryType === 'count') {
      this.condition.field.aggEnabled = false;
    } else {
      this.condition.field.aggEnabled = true;
    }
  }

  /*
  * @param {integer} n on y axis
  */
  _drawChartThreshold(chart, n) {
    const len = chart.yAxis[0].length;
    chart.yAxis[1] = Array.apply(null, Array(len)).map(Number.prototype.valueOf, n);
  }

  _updateChartQueryParamsOver(over) {
    this.watcher._source.wizard.chart_query_params.over = pick(over, ['type', 'n', 'field']);
  }

  _updateChartQueryParamsQueryType(type) {
    this.watcher._source.wizard.chart_query_params.queryType = type;
    if (type === 'count') {
      delete this.watcher._source.wizard.chart_query_params.field;
    }
  }

  _updateChartQueryParamsLast(n, unit) {
    this.watcher._source.wizard.chart_query_params.last = { unit, n: +n };
  }

  _updateChartQueryParamsInterval(n, unit) {
    this.watcher._source.wizard.chart_query_params.interval = { unit, n: +n };
  }

  _updateChartQueryParamsThreshold(n, direction) {
    this.watcher._source.wizard.chart_query_params.threshold = { direction, n: +n };
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
  async _queryMetricAgg({index, over, last, interval, field, threshold, metricAggType, timeField}) {
    this._onProgress();

    try {
      let resp;
      try {
        if (metricAggType === 'average') {
          this.chartQuery = this.queryBuilder.average({over, last, interval, field, timeField});
          resp = await this.watcherEditorChartService.metricAggAverage({index, query: JSON.stringify(this.chartQuery)});
        } else if (metricAggType === 'sum') {
          this.chartQuery = this.queryBuilder.sum({over, last, interval, field, timeField});
          resp = await this.watcherEditorChartService.metricAggSum({index, query: JSON.stringify(this.chartQuery)});
        } else if (metricAggType === 'min') {
          this.chartQuery = this.queryBuilder.min({over, last, interval, field, timeField});
          resp = await this.watcherEditorChartService.metricAggMin({index, query: JSON.stringify(this.chartQuery)});
        } else if (metricAggType === 'max') {
          this.chartQuery = this.queryBuilder.max({over, last, interval, field, timeField});
          resp = await this.watcherEditorChartService.metricAggMax({index, query: JSON.stringify(this.chartQuery)});
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
  async _queryCount({ index, over, last, interval, field, threshold, timeField }) {
    this._onProgress();

    try {
      let resp;
      try {
        this.chartQuery = this.queryBuilder.count({over, last, interval, field, timeField});
        resp = await this.watcherEditorChartService.count({index, query: JSON.stringify(this.chartQuery)});
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
      watcher: '=',
      updateStatus: '&',
      onQueryChange: '&',
      onConditionChange: '&',
      aceOptions: '&',
      turnIntoAdvanced: '&',
      indexesData: '=',
      errorMessage: '&',
    },
    controller:  ConditionPanelWatcherEdit,
    controllerAs: 'conditionPanelWatcherEdit',
    bindToController: {
      watcher: '=',
      updateStatus: '&',
      onQueryChange: '&',
      onConditionChange: '&',
      aceOptions: '&',
      turnIntoAdvanced: '&',
      indexesData: '=',
      errorMessage: '&',
    },
  };
}

export default conditionPanelWatcherEdit;
