import Joi from 'joi';

// siren: Configuration for the watcher saved object.
const WatchConfiguration = {
  type: 'sentinl-watcher',
  title: 'watcher_title',
  schema: Joi.object().keys({
    title: Joi.string(),
    input: Joi.object(),
    actions: Joi.object(),
    transform: Joi.object(),
    condition: Joi.object(),
    report: Joi.boolean(),
    disable: Joi.boolean(),
    trigger: Joi.object()
  })
};

export default WatchConfiguration;
