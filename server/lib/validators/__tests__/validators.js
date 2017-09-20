import { pluck, isEqual } from 'lodash';
import expect from 'expect.js';
import anomaly from '../anomaly';
import range from '../range';
import compare from '../compare';

describe('Validators', function () {
  let payload;

  const init = function () {
    payload = {
      hits: {
        total: 285133,
        hits: [
          { _source: { amount: -57 }},
          { _source: { amount: 55 }},
          { _source: { amount: -20 }},
          { _source: { amount: -10 }},
          { _source: { amount: -5 }},
          { _source: { amount: 0 }},
          { _source: { amount: 1 }},
          { _source: { amount: 5 }},
          { _source: { amount: 7 }},
          { _source: { amount: 4 }},
          { _source: { amount: 1 }},
          { _source: { amount: 7 }},
          { _source: { amount: 2 }},
          { _source: { amount: 12 }},
          { _source: { amount: 12 }},
          { _source: { amount: 16 }}
        ]
      }
    };
  };

  beforeEach(function () {
    init();
  });

  it('check anomaly (static mode)', function () {
    const condition = {
      anomaly: {
        field_to_check: 'amount',
        normal_values: [
          1,
          5,
          8,
          10,
          15,
          20
        ]
      }
    };
    const result = anomaly.check(payload, condition);
    const values = pluck(result.anomaly, '_source.amount');
    expect(isEqual(values.sort(), [ -57, 55, -20, -10 ].sort())).to.be(true);
  });

  it('check anomaly (dynamic mode)', function () {
    const condition = {
      anomaly: {
        field_to_check: 'amount'
      }
    };
    const result = anomaly.check(payload, condition);
    const values = pluck(result.anomaly, '_source.amount');
    expect(isEqual(values.sort(), [ -57, 55 ].sort())).to.be(true);
  });

  it('check range', function () {
    const condition = {
      range: {
        field_to_check: 'amount',
        min: -10,
        max: 50,
        tolerance: 1
      }
    };
    const result = range.check(payload, condition);
    const values = pluck(result.outside_the_range, '_source.amount');
    expect(isEqual(values.sort(), [ -57, 55, -20 ].sort())).to.be(true);
  });

  it('compare values, success', function () {
    const condition = {
      compare: {
        'payload.hits.total': {
          gte: 28513,
          lte: 285133
        }
      }
    };

    expect(compare.valid(payload, condition)).to.be(true);
  });

  it('compare values, fail', function () {
    const condition = {
      compare: {
        'payload.hits.total': {
          gt: 2851330
        }
      }
    };

    expect(compare.valid(payload, condition)).to.be(false);
  });

});
