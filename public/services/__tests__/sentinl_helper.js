import ngMock from 'ng_mock';
import expect from 'expect.js';
import {isEqual} from 'lodash';

describe('sentinlHelper', function () {

  let sentinlHelper;

  const init = function () {
    ngMock.module('kibana');

    ngMock.inject((_sentinlHelper_) => {
      sentinlHelper = _sentinlHelper_;
    });
  };

  beforeEach(function () {
    init();
  });

  it('must remove all properties that have name beginning with "$"', function (done) {
    const input = {
      rules: 'catch all rabbits',
      a: {'$rabbit': true},
      b: {
        c: {
          '$rabbit': {},
          '$rabbit': {d: false},
          '$rabbit': [1, 2, 3],
          boo: ['monkey', 'snake'],
          ok: ['a', '$rabbit', 'c', '$rabbit'],
          ko: [{'$rabbit': 2}, {tiger: 1}, {'$rabbit': 1}],
        },
      },
    };

    const model = {
      rules: 'catch all rabbits',
      a: {},
      b: {
        c: {
          boo: ['monkey', 'snake'],
          ok: ['a', 'c'],
          ko: [{}, {tiger: 1}, {}]
        }
      }
    };

    sentinlHelper.stripObjectPropertiesByNameRegex(input, /\$.*/);
    expect(isEqual(input, model)).to.be(true);
    done();
  });
});
