export default class GetNotifier {
  constructor($injector) {
    this.$injector = $injector;
  }

  create(locationName) {
    if (this.$injector.has('createNotifier')) {
      const createNotifier = this.$injector.get('createNotifier');
      return createNotifier({
        location: locationName
      });
    }
    const Notifier = this.$injector.get('Notifier');
    return new Notifier({
      location: locationName
    });
  }
}
