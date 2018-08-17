/*
 * Copyright 2016, Lorenzo Mangani (lorenzo.mangani@gmail.com)
 * Copyright 2015, Rao Chenlin (rao.chenlin@gmail.com)
 *
 * This file is part of Sentinl (http://github.com/sirensolutions/sentinl)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Boom from 'boom';
import _ from 'lodash';
import { errors as esErrors } from 'elasticsearch';

module.exports = function handleESError(error) {
  if (!(error instanceof Error)) {
    throw new Error('Expected an instance of Error');
  }

  if (error instanceof esErrors.ConnectionFault ||
    error instanceof esErrors.ServiceUnavailable ||
    error instanceof esErrors.NoConnections ||
    error instanceof esErrors.RequestTimeout) {
    return Boom.serverTimeout(error);
  } else if (error instanceof esErrors.Conflict || _.includes(error.message, 'index_template_already_exists')) {
    return Boom.conflict(error);
  } else if (error instanceof esErrors[403]) {
    return Boom.forbidden(error);
  } else if (error instanceof esErrors.NotFound) {
    return Boom.notFound(error);
  } else if (error instanceof esErrors.BadRequest) {
    return Boom.badRequest(error);
  } else if (error.status || error.statusCode) {
    return Boom.boomify(error, { statusCode: error.status || error.statusCode });
  } else {
    return error;
  }
};
