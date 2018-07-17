import Joi from 'joi';

// siren: Configuration for the watcher saved object.
const UserConfiguration = {
  type: 'sentinl-user',
  schema: Joi.object().keys({
    username: Joi.string(),
    password: Joi.string()
  })
};

export default UserConfiguration;
