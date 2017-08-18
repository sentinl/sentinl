import Joi from 'joi';

// siren: Configuration for the watcher saved object.
const ScriptConfiguration = {
  type: 'sentinl-script',
  schema: Joi.object().keys({
    title: Joi.string(),
    script_type: Joi.string(),
    body: Joi.string()
  })
};

export default ScriptConfiguration;
