class Alarm {

  constructor($http) {
    this.$http = $http;
  }

  /**
  * Lists all available alarms.
  */
  list() {
    return this.$http.get('../api/sentinl/list/alarms').catch(function (err) {
      throw new Error('Alarm list: ' + err.toString());
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
      throw new Error('Alarm delete: ' + err.toString());
    });
  }

  /**
  * Sets timepicker filter time interval.
  *
  * @param {object} timeInterval - timepicker time.
  */
  updateFilter(timeInterval) {
    return this.$http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F')).catch(function (err) {
      throw new Error('Alarm update filter: ' + err.toString());
    });
  }
}

export default Alarm;
