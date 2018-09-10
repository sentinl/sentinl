import Migration from 'kibiutils/lib/migrations/migration';

/**
 * Sentinl - Migration 1.
 *
 * Looks for an obsolete object of type "sentinl-script"
 * in kibana.index and removes all found
 *
 * This objects were created a long time ago and are obsolete
 */

export default class Migration1 extends Migration {

  constructor(configuration) {
    super(configuration);

    this._client = configuration.client;
    this._index = configuration.config.get('kibana.index');
    this._logger = configuration.logger;
    this._type = 'sentinl-script';
  }

  static get description() {
    return 'Find obsolete objects of type "sentinl-script" in kibana.index and remove them';
  }

  async count() {
    const objects = await this.scrollSearch(this._index, this._type);
    return objects.length;
  }

  async upgrade() {
    const objects = await this.scrollSearch(this._index, this._type);
    const count = objects.length;
    if (count === 0) {
      return 0;
    }

    let body = '';
    for (const obj of objects) {
      body += JSON.stringify({
        delete: {
          _index: obj._index,
          _type: obj._type,
          _id: obj._id
        }
      }) + '\n';
    }

    await this._client.bulk({
      refresh: true,
      body: body
    });

    return count;
  }

}
