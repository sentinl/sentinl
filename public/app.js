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

/* import controllers */
import './controllers/sentinlWatchers';
import './controllers/sentinlReports';
import './controllers/sentinlAlarms';
import './controllers/sentinlAbout';
import './controllers/confirmMessageController';

/* import factories */
import './factories/navMenu.js';

/* import services */
import './services/sentinlService.js';

/* import filters */
import './filters/moment.js';

/* import directives */
import './directives/watcherWizard/watcher-wizard';
import './directives/newAction/new-action';
import './directives/emailAction/email-action';
import './directives/emailHtmlAction/emailHtml-action';
import './directives/webhookAction/webhook-action';
import './directives/reportAction/report-action';
import './directives/slackAction/slack-action';
import './directives/consoleAction/console-action';
import './directives/scheduleTag/schedule-tag';

/* Styles */
import './less/main.less';
import 'ui/autoload/styles';

/* Libs */
import 'ui/kbn_top_nav';
import 'ui/listen';
import 'ui/timepicker';
import 'ui/timefilter';
import 'ui/directives/pretty_duration';

/* Routes */
import './app.routes.js';
