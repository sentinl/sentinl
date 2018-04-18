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
      yAxis: [],
      options: {},
    };

    this.chartQueryParams = {
      index: ['watcher_aggs_test'],
      over: '_all',
      last: { n: 15, unit: 'minutes' },
      interval: { n: 1, unit: 'minutes' },
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
        handleSelect: (direction, number) => {
          this.$log.debug('select threshold:', direction, number);
        },
      },
      last: {
        handleSelect: (unit, n) => {
          this.$log.debug('select last:', unit, n);
          this.chartQueryParams.last = { unit, n };
          this.countAll(pick(this.chartQueryParams, ['index', 'over', 'last', 'interval']));
        },
      },
    };

    this.countAll(pick(this.chartQueryParams, ['index', 'over', 'last', 'interval']));
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
            this.chart.yAxis.push(bucket.doc_count);
          });
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
    this.chart.yAxis = [];
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
