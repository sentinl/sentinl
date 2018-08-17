import mustache from 'mustache';

const renderMustacheEmailSubjectAndText = function (actionName, subject, body, payload) {
  subject = subject || `SENTINL: ${actionName}`;
  body = !body || !body.length ? 'Series Report {{payload._id}}: {{payload.hits.total}}' : body;
  return {
    subject: mustache.render(subject, {payload}),
    text: mustache.render(body, {payload}),
  };
};

export {
  renderMustacheEmailSubjectAndText
};
