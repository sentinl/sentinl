import './condition_panel_watcher_edit.less';
import template from './condition_panel_watcher_edit.html';

import moment from 'moment';
import {has, pick} from 'lodash';

class ConditionPanelWatcherEdit {
  constructor($http, $log, $scope, watcherEditorChartService) {
    this.$http = $http;
    this.$log = $log;
    this.$scope = $scope;
    this.watcherEditorChartService = watcherEditorChartService;

    this.chart = {
      xAxis: [],
      yAxis: [[], []],
      options: {
        title: {
          display: false,
          text: 'Historical results chart'
        },
      },
    };

    this.chartQueryParams = {
      index: ['watcher_aggs_test'],
      // index: watcher._source.search.request.index,
      over: '_all',
      last: { n: 15, unit: 'minutes' },
      interval: { n: 1, unit: 'minutes' },
      threshold: { n: 10, directon: 'above' },
    };

    this.condition = {
      type: {
        handleSelect: (type) => {
          this.$log.debug('select type:', type);
        },
      },
      over: {
        handleSelect: (field) => {
          this.$log.debug('select over:', field);
        },
      },
      threshold: {
        handleSelect: (direction, n) => {
          this.$log.debug('select threshold:', direction, n);
          this.updateChartQueryParamsThreshold(n, direction);
          this.drawThreshold(this.chartQueryParams.threshold.n);
        },
      },
      last: {
        handleSelect: (unit, n) => {
          this.$log.debug('select last:', unit, n);
          this.updateChartQueryParamsLast(n, unit);
          this.countAll(pick(this.chartQueryParams, ['index', 'over', 'last', 'interval']));
        },
      },
    };

    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source.trigger.schedule.later', () => {
      this.updateChartQueryParamsInterval(this.watcher._source.trigger.schedule.later);
      this.countAll(pick(this.chartQueryParams, ['index', 'over', 'last', 'interval']));
    });

    this.$scope.$watch('conditionPanelWatcherEdit.watcher._source.input.search.request.index', () => {
      // this.chartQueryParams.index = this.watcher._source.input.search.request.index;
    });

    this.countAll(pick(this.chartQueryParams, ['index', 'over', 'last', 'interval']));
  }

  /*
  * @param {integer} n on y axis
  */
  drawThreshold(n) {
    const len = this.chart.yAxis[0].length;
    this.chart.yAxis[1] = Array.apply(null, Array(len)).map(Number.prototype.valueOf, n);
  }

  /*
  * @param {string} interval of time: every 1 minutes
  */
  scheduleModeEveryIsUsed(interval) {
    if (interval.match(/every \d+ (seconds|minutes|hours|days|months|years)/g)) {
      return true;
    }
    return false;
  }

  /*
  * @param {string} interval of time: every 1 minutes
  */
  updateChartQueryParamsInterval(interval) {
    if (this.scheduleModeEveryIsUsed(interval)) {
      interval = interval.split(' ');
      this.chartQueryParams.interval = {
        n: +interval[1],
        unit: interval[2],
      };
    }
  }

  updateChartQueryParamsLast(n, unit) {
    this.chartQueryParams.last = { unit, n: +n };
  }

  updateChartQueryParamsThreshold(n, direction) {
    this.chartQueryParams.threshold = { direction, n: +n };
  }

  async countAll({index, over, last, interval}) {
    try {
      const resp = await this.watcherEditorChartService.countAll({ index, over, last, interval });
      this.purgeChartData();

      if (has(resp, 'data.aggregations.dateAgg.buckets')) {
        if (!resp.data.aggregations.dateAgg.buckets.length) {
          this.$log.warn('count all, no aggregation results found', resp);
        } else {
          resp.data.aggregations.dateAgg.buckets.forEach((bucket) => {
            this.chart.xAxis.push(this.formatTimeForXAxis(bucket.key, last.unit));
            this.chart.yAxis[0].push(bucket.doc_count);
          });
          this.drawThreshold(this.chartQueryParams.threshold.n);
        }
      } else {
        this.$log.warn('count all, no aggregation results found', resp);
      }
      this.$log.debug('count all resp:', resp);
    } catch (err) {
      this.$log.error(`fail to count all: ${err.message}`);
    }
  }

  purgeChartData() {
    this.chart.xAxis = [];
    this.chart.yAxis[0] = [];
  }

  /*
  * @return {string} formatted time - April 18, 2018 4:58 PM
  */
  formatTimeForXAxis(epochTime, unit) {
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
    this.$log.debug('formatTimeForX:', unit, locale);
    return moment(epochTime).format(locale);
  }

  onChartClick() {
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
