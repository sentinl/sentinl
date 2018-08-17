/*global later:false*/
import moment from 'moment';
import 'later/later';
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
      const result = $filter('nextScheduleOccurrence')(schedule, 'utc');
      expect(result).to.eql(moment(later.schedule(later.parse.text(schedule)).next()).format('D/M/YYYY HH:mm:ss'));
      done();
    });

    it('should calculate the next schedule occurrence in a local timezone', function (done) {
      const result = $filter('nextScheduleOccurrence')(schedule, 'local');
      later.date.localTime();
      expect(result).to.eql(moment(later.schedule(later.parse.text(schedule)).next()).format('D/M/YYYY HH:mm:ss'));
      done();
    });
  });
});
