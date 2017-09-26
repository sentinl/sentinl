import { keys, get, forEach } from 'lodash';
import CompareDate from './compare_date';

/**
* Simple comparison.
*
* https://www.elastic.co/guide/en/x-pack/current/condition-compare.html
* @param {object} payload - elasticsearch response with hits
* @param {object} condition - condition settings
* @returns {boolean}
*/
const valid = function (payload, condition) {
  const operator = {
    eq: '===',
    not_eq: '!==',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<='
  };

  const key = keys(condition.compare)[0].split('.').splice(1).join('.');
  const operators = keys(condition.compare[`payload.${key}`]);
  const value = get(payload, key);

  let comparisons = operators.length;

  if (/^-?(\d+[\.\/]?\d+|\d+)$/.test(value)) {
    forEach(operators, function (op) {
      if (eval(value + operator[op] + condition.compare[`payload.${key}`][op])) { // eslint-disable-line no-eval
        comparisons--;
      }
    });
  } else {
    forEach(operators, function (op) {
      if (CompareDate.valid(value, operator[op], condition.compare[`payload.${key}`][op])) {
        comparisons--;
      }
    });
  }

  if (comparisons) {
    return false;
  }

  return true;
};

module.exports = {
  valid
};
