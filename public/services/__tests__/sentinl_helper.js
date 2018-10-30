import ngMock from 'ng_mock';
import expect from 'expect.js';

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
    expect(input).to.eql(model);
    done();
  });

  it('must get fields of object type from mappings', function (done) {
    const mappings = {
      tweet : {
        properties : {
          person : {
            type : 'object',
            properties : {
              name : {
                properties : {
                  first_name : {type : 'text'},
                  last_name : {type : 'text'}
                }
              },
              sid : {type : 'string', index : 'not_analyzed'}
            }
          }
        }
      }
    };

    const fields = sentinlHelper.getFieldsFromMappings(mappings);
    expect(fields).to.eql({
      date: [],
      text: [
        'person.name.first_name',
        'person.name.last_name',
        'person.sid',
      ],
      numeric: []
    });
    done();
  });

  it('must get fields of core type from mappings', function (done) {
    const mappings = {
      tweet : {
        properties : {
          user : {type : 'text'},
          message : {type : 'string', null_value : 'na'},
          postDate : {type : 'date'},
          priority : {type : 'integer'},
          rank : {type : 'float'}
        }
      }
    };

    const fields = sentinlHelper.getFieldsFromMappings(mappings);
    expect(fields).to.eql({
      date: [ 'postDate' ],
      text: [ 'user', 'message' ],
      numeric: [ 'priority', 'rank' ]
    });
    done();
  });

  it('must get fields of multi field type from mappings', function (done) {
    const mappings = {
      tweet : {
        properties : {
          name : {
            type : 'multi_field',
            fields : {
              name : {type : 'text'},
              untouched : {type : 'text'}
            }
          }
        }
      }
    };

    const fields = sentinlHelper.getFieldsFromMappings(mappings);
    expect(fields).to.eql({
      date: [],
      text: [ 'name.name', 'name.untouched' ],
      numeric: []
    });
    done();
  });

  it('must get fields of keyword type from mappings', function (done) {
    const mappings = {
      company: {
        mappings: {
          Company: {
            properties: {
              blog_feed_url: {
                type: 'keyword',
                fields: {
                  raw: {
                    type: 'keyword',
                    ignore_above: 768
                  }
                }
              },
              company: {
                properties: {
                  name: {
                    properties: {
                      label: {
                        type: 'text',
                        store: true,
                        fields: {
                          raw: {
                            type: 'keyword',
                            ignore_above: 768
                          }
                        }
                      }
                    }
                  },
                  number_of_employees: {
                    type: 'long',
                    store: true
                  }
                }
              },
            }
          }
        }
      }
    };

    const fields = sentinlHelper.getFieldsFromMappings(mappings);
    expect(fields).to.eql({
      date: [],
      text: [
        'blog_feed_url',
        'blog_feed_url.raw',
        'company.name.label',
        'company.name.label.raw'
      ],
      numeric: [ 'company.number_of_employees' ]
    });
    done();
  });

  it('must return empty field arrays if mappings does not have "properties"', function (done) {
    const mappings = {};

    const fields = sentinlHelper.getFieldsFromMappings(mappings);
    expect(fields).to.eql({ date: [], text: [], numeric: [] });
    done();
  });
});
