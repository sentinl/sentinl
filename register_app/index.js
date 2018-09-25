import { existsSync } from 'fs';
import path from 'path';

export default function registerApp(kibana, requirements) {
  const platformIsSiren = existsSync(path.join(__dirname, '../../../src/siren_core_plugins/saved_objects_api'));
  return !platformIsSiren ? require('./register_kibana_app')(kibana, requirements) : require('./register_siren_app')(kibana, requirements); 
}
