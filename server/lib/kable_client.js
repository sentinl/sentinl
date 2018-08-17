export default class KableClient {
  constructor(server) {
    this.server = server;
  }

  /*
  * @param {object} payload for kable app
  */
  async run(payload) {
    try {
      const { result } = await this.server.inject({
        method: 'POST',
        url: '/api/sentinl/kable/run',
        headers: {
          'kbn-xsrf': 'anything',
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        payload,
      });
      return result;
    } catch (err) {
      throw new Error('kable client run: ' + err.toString());
    }
  }
}
