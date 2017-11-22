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

/* controllers */
import './controllers/watchersController';
import './controllers/editorController';
import './controllers/reportsController';
import './controllers/alarmsController';
import './controllers/aboutController';
import './controllers/confirmMessageController';

/* services */
import './services/watcher';
import './services/script';
import './services/user';
import './services/alarm';
import './services/report';
import './services/navMenu';
import './services/dataTransfer';

/* filters */
import './filters/moment';

/* directives */
import './directives/newAction/new-action';
import './directives/emailAction/email-action';
import './directives/emailHtmlAction/emailHtml-action';
import './directives/webhookAction/webhook-action';
import './directives/reportAction/report-action';
import './directives/slackAction/slack-action';
import './directives/consoleAction/console-action';
import './directives/periodTag/period-tag';

/* styles */
import 'bootstrap/dist/css/bootstrap.min.css';
import './less/main.less';
import 'ui/autoload/styles';

/* libs */
import 'ui/kbn_top_nav';
import 'ui/listen';
import 'ui/timepicker';
import 'ui/timefilter';
import 'ui/directives/pretty_duration';

/* routes */
import './app.routes';

/* dynamically inserted modules */
