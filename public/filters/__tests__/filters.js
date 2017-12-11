import moment from 'moment';
import later from 'later';
import ngMock from 'ng_mock';
import expect from 'expect.js';

describe('Filters', function () {
  describe('nextScheduleOccurence', function () {
    let $filter;
    const schedule = 'at 15:00';

    beforeEach(function () {
      ngMock.module('nextScheduleOccurrence');
      ngMock.inject(function (_$filter_) {
        $filter = _$filter_;
      });
    });

    it('should calculate the next schedule occurrence in UTC', function (done) {
      const sentinlConfig = {
        es: {
          watcher: {}
        }
      };
      const result = $filter('nextScheduleOccurrence')(schedule, sentinlConfig);
      expect(result).to.eql(moment(later.schedule(later.parse.text(schedule)).next()).format('D/M/YYYY HH:mm:ss'));
      done();
    });

    it('should calculate the next schedule occurrence in a local timezone', function (done) {
      const sentinlConfig = {
        es: {
          watcher: {
            schedule_timezone: 'local'
          }
        }
      };
      const result = $filter('nextScheduleOccurrence')(schedule, sentinlConfig);
      later.date.localTime();
      expect(result).to.eql(moment(later.schedule(later.parse.text(schedule)).next()).format('D/M/YYYY HH:mm:ss'));
      done();
    });
  });
});
