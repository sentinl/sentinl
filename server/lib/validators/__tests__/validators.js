import { map, isEqual } from 'lodash';
import expect from 'expect.js';
import anomaly from '../anomaly';
import range from '../range';
import compare from '../compare';
import compareArray from '../compare_array';
import moment from 'moment';

describe('Validators', function () {
  let payload;

  const init = function () {
    payload = {
      time: moment().subtract(moment.duration(10, 'm')).format(), // time 10 min ago
      aggregations: {
        top_amounts: {
          buckets: [
            { doc_count: 5 },
            { doc_count: 1 },
            { doc_count: 2 }
          ]
        }
      },
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
    const values = map(result.anomaly, '_source.amount');
    expect(isEqual(values.sort(), [ -57, 55, -20, -10 ].sort())).to.be(true);
  });

  it('check anomaly (dynamic mode)', function () {
    const condition = {
      anomaly: {
        field_to_check: 'amount'
      }
    };
    const result = anomaly.check(payload, condition);
    const values = map(result.anomaly, '_source.amount');
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
    const values = map(result.outside_the_range, '_source.amount');
    expect(isEqual(values.sort(), [ -57, 55, -20 ].sort())).to.be(true);
  });

  it('compare single value', function () {
    const condition = {
      compare: {
        'payload.hits.total': {
          gt: 2851330
        }
      }
    };

    expect(compare.valid(payload, condition)).to.be(false);
  });

  it('compare multiple values', function () {
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

  it('compare date', function () {
    const condition = {
      compare: {
        'payload.time': {
          gt: '<{now-5m}>'
        }
      }
    };

    expect(compare.valid(payload, condition)).to.be(false);
  });

  it('compare array, some', function () {
    const condition = {
      array_compare: {
        'payload.aggregations.top_amounts.buckets': {
          path: 'doc_count',
          gte: {
            value: 5,
            quantifier: 'some'
          }
        }
      }
    };

    expect(compareArray.valid(payload, condition)).to.be(true);
  });

  it('compare array, all', function () {
    const condition = {
      array_compare: {
        'payload.aggregations.top_amounts.buckets': {
          path: 'doc_count',
          gte: {
            value: 5,
            quantifier: 'all'
          }
        }
      }
    };

    expect(compareArray.valid(payload, condition)).to.be(false);
  });
});
