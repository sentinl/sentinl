import { forEach } from 'lodash';

/**
* Checks if value is outside the range.
*/

/**
* Test value.
*
* @param {integer} value - a number
* @param {object} condition - object with properties: min, max, tolerance and field_to_check
* @returns {boolean} true or false
*/
const test = function (value, condition) {
  if (!condition.tolerance) condition.tolerance = 0;
  if (condition.max && value > condition.max + condition.tolerance) return true;
  if (condition.min && value < condition.min - condition.tolerance) return true;
  return false;
};

/**
* Finding hits outside the range defined in condition.
*
* @param {object} payload - elasticsearch response with hits
* @param {object} condition - condition settings
* @returns {objects} payload - payload with hits inside 'outside_the_range' property
*/
const check = function (payload, condition) {
  forEach(payload.hits.hits, function (hit) {
    if (test(hit._source[condition.range.field_to_check], condition.range)) {
      if (!payload.outside_the_range) {
        payload.outside_the_range = [];
      }
      payload.outside_the_range.push(hit);
    }
  });
  return payload;
};

module.exports = {
  check
};
