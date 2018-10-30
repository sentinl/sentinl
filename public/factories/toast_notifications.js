export default function toastNotificationsFactory() {
  const notify = require('ui/notify');

  if (notify.toastNotifications) { // Kibana v6.3+
    return notify.toastNotifications;
  }

  // Kibana v5.6-6.2
  class ToastNotifications extends notify.Notifier {
    constructor() {
      super();
    }
    addDanger = (message) => this.error(message);
    addWarning = (message) => this.warning(message);
    addSuccess = (message) => this.info(message);
  }

  return new ToastNotifications;
}
