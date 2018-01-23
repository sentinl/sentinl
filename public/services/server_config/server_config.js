class ServerConfig {

  constructor($http) {
    this.$http = $http;
  }

  /**
  * Gets some of Sentinl configuration settings.
  */
  get() {
    return this.$http.get('../api/sentinl/config').then((response) => {
      if (response.status !== 200) {
        throw new Error('Fail to get Sentinl configuration');
      }
      return response;
    });
  }
}

export default ServerConfig;
