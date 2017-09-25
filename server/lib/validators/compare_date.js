import moment from 'moment';

/**
* Checks if date inside period
*/

class CompareDate {
  constructor() {}

  /**
  * Gets time duration
  *
  * @param {integer} value - integer which defines time
  * @param {string} unit - time unit (y, M, m, w, d, h, s, ms)
  * @return {object} moment duration
  */
  getDuration(value, unit) {
    return moment.duration(value, unit);
  }

  /**
  * Checks if date inside period
  *
  * @param {string} date - date, 2017-09-21T15:26:38+02:00
  * @param {string} operator - comparison operator: <, <=, >, >=, !==, ===
  * @param {string} period - time period strating from now in date math format: '<{now-5m}>', '<{now+5m}>'
  * @return {bool}
  */
  valid(date, operator, period) {
    const now = moment();
    date = moment(date);

    period = {
      text: period.match(/[^{}]+(?=})/g)[0],
      operator: period.includes('+') ? '+' : '-'
    };

    period.value = +period.text.split(period.operator)[1].match(/\d+/g)[0];
    period.unit = period.text.split(period.operator)[1].match(/[yMwdhms]+/g)[0];
    period.duration = this.getDuration(period.value, period.unit);

    if (period.operator === '+') {
      now.add(period.duration);
    } else {
      now.subtract(period.duration);
    }

    return eval(date.unix() + operator + now.unix()); // eslint-disable-line no-eval
  }
}

export default new CompareDate();
