export default class GetToastNotifications {
  constructor($injector) {
    this.$injector = $injector;
  }

  getService() {
    if (this.$injector.has('notifier')) {
      return this.$inject.get('notifier');
    }
    return require('ui/notify').toastNotifications;
  }

  static factory($injector) {
    const notify = new GetToastNotifications($injector);
    return notify.getService();
  }
}
