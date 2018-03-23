import { keys, get, forEach, cloneDeep, map, uniq } from 'lodash';

/**
* Array comparison.
*
* https://www.elastic.co/guide/en/x-pack/current/condition-array-compare.html
* @param {object} payload - elasticsearch response with hits
* @param {object} condition - condition settings
* @return {boolean}
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

  const key = keys(condition.array_compare)[0].split('.').splice(1).join('.');
  const path = condition.array_compare[`payload.${key}`].path;
  const values = uniq(map(get(payload, key), path));
  const operators = cloneDeep(condition.array_compare[`payload.${key}`]);
  delete operators.path;

  let comparisons = values.length;

  forEach(operators, function (property, op) {
    forEach(values, function (value) {
      if (eval(value + operator[op] + condition.array_compare[`payload.${key}`][op].value)) { // eslint-disable-line no-eval
        if (!property.quantifier || property.quantifier === 'some') {
          comparisons = 0;
          return true;
        }
        comparisons--;
      }
    });
  });

  if (comparisons) {
    return false;
  }

  return true;
};

module.exports = {
  valid
};
