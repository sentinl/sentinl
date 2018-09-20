import { uiModules } from 'ui/modules';
import searchFilter from './search_filter';

const module = uiModules.get('apps/sentinl');
module.directive('searchFilter', searchFilter);
