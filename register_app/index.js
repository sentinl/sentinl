export default function registerApp(kibana, requirements, platformIsSiren) {
  return !platformIsSiren ? require('./register_kibana_app')(kibana, requirements) : require('./register_siren_app')(kibana, requirements); 
}
