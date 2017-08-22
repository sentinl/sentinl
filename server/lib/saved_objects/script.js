import Joi from 'joi';

// siren: Configuration for the watcher saved object.
const ScriptConfiguration = {
  type: 'sentinl-script',
  schema: Joi.object().keys({
    title: Joi.string(),
    description: Joi.string(),
    body: Joi.string()
  })
};

export default ScriptConfiguration;
