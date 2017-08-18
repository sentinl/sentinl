import Joi from 'joi';

// siren: Configuration for the watcher saved object.
const UserConfiguration = {
  type: 'sentinl-script',
  schema: Joi.object().keys({
    watcher_id: Joi.string(),
    username: Joi.string(),
    password: Joi.string()
  })
};

export default UserConfiguration;
