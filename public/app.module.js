import { uiModules } from 'ui/modules';
import 'angular-ui-bootstrap';

const app = uiModules.get('api/sentinl', ['ui.bootstrap']);
export { app };
