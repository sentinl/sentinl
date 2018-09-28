class Alarm {
  constructor($http, sentinlHelper) {
    this.$http = $http;
    this.sentinlHelper = sentinlHelper;
  }

  /**
  * Lists all available alarms.
  */
  list() {
    return this.$http.get('../api/sentinl/list/alarms').catch(function (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Alarm list'));
    });
  }


  /**
  * Deletes single alarm.
  *
  * @param {string} index - index name.
  * @param {string} type - alarm type.
  * @param {string} id - alarm id.
  */
  delete(index, type, id) {
    return this.$http.delete(`../api/sentinl/alarm/${index}/${type}/${id}`).then(function () {
      return id;
    }).catch(function (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Alarm delete'));
    });
  }

  /**
  * Sets timepicker filter time interval.
  *
  * @param {object} timeInterval - timepicker time.
  */
  updateFilter(timeInterval) {
    return this.$http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F')).catch(function (err) {
      throw new Error(this.sentinlHelper.apiErrMsg(err, 'Alarm update time filter'));
    });
  }
}

export default Alarm;
