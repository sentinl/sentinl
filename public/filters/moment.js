import moment from 'moment';

import { app } from '../app.module';

app.filter('moment', function () {
  return function (dateString) {
    return moment(dateString).format('YYYY-MM-DD HH:mm:ss.sss');
  };
});


