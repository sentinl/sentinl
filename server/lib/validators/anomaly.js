import { forEach, filter, has, map} from 'lodash';
import AnomalyFinder from 'anomaly-finder';

/**
* Finding anomaly.
*
* @param {object} payload - elasticsearch response with hits
* @param {object} condition - condition settings
* @returns {objects} payload - payload with hits inside 'anomaly' property
*/
const check = function (payload, condition) {
  const hound = new AnomalyFinder();

  // static mode
  if (condition.anomaly.normal_values) {
    forEach(payload.hits.hits, function (hit) {
      let value = hit._source[condition.anomaly.field_to_check];
      if (hound.find(condition.anomaly.normal_values, value)) {
        if (!has(payload, 'anomaly')) {
          payload.anomaly = [];
        }
        payload.anomaly.push(hit);
      }
    });
  }

  // dynamic mode
  if (!condition.anomaly.normal_values) {
    const anomaly = [];
    const field = condition.anomaly.field_to_check;
    const values = map(payload.hits.hits, `_source.${field}`);
    forEach(payload.hits.hits, function (hit) {
      let otherValues = filter(values, v => v !== hit._source[field]);
      if (hound.find(otherValues, hit._source[field])) {
        anomaly.push(hit);
      }
    });

    if (anomaly.length) {
      payload.anomaly = anomaly;
    }
  }

  return payload;
};

module.exports = {
  check
};
