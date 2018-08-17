export default class TimelionClient {
  constructor(server) {
    this.server = server;
  }

  /*
  * @param {object} payload for timelion app
  */
  async run(payload) {
    try {
      const { result } = await this.server.inject({
        method: 'POST',
        url: '/api/sentinl/timelion/run',
        headers: {
          'kbn-xsrf': 'anything',
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        payload,
      });
      return result;
    } catch (err) {
      throw new Error('timelion client run: ' + err.toString());
    }
  }
}
