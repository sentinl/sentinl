/*global angular*/

const base = '../api/sentinl';
const API = {
  WATCHER_EDIT: {
    COUNT: `${base}/watcher/wizard/count`,
    AVERAGE: `${base}/watcher/wizard/average`,
    SUM: `${base}/watcher/wizard/sum`,
    MIN: `${base}/watcher/wizard/min`,
    MAX: `${base}/watcher/wizard/max`,
  },
  ES: {
    ALL_INDEXES: `${base}/watcher/wizard/indexes`,
    GET_MAPPING: `${base}/watcher/wizard/getmapping`,
  },
};

angular.module('apps/sentinl.apiConstants', []).constant('API', API);
