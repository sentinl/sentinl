class Alarm {

  constructor($http) {
    this.$http = $http;
  }

  /**
  * Lists all available alarms.
  */
  list() {
    return this.$http.get('../api/sentinl/list/alarms')
      .then((response) => {
        if (response.status !== 200) {
          throw new Error('Fail to list alarms');
        }
        return response;
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
    return this.$http.delete(`../api/sentinl/alarm/${index}/${type}/${id}`)
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`Fail to delete alarm or report ${id}`);
        }
        return id;
      });
  }

  /**
  * Sets timepicker filter time interval.
  *
  * @param {object} timeInterval - timepicker time.
  */
  updateFilter(timeInterval) {
    return this.$http.get('../api/sentinl/set/interval/' + JSON.stringify(timeInterval).replace(/\//g, '%2F'))
      .then((response) => {
        if (response.status !== 200) {
          throw new Error('Fail to set time filter');
        }
        return response;
      });
  }
}

export default Alarm;
