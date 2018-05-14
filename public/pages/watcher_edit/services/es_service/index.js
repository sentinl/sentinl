import { uiModules } from 'ui/modules';
import EsService from './es_service';

const module = uiModules.get('apps/sentinl');
module.factory('esService', ($http, API) => new EsService($http, API));
