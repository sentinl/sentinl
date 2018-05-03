const isObject = function (arg) {
  return arg != null && typeof arg === 'object';
};

const stripObjectPropertiesByNameRegex = function (obj, nameRegex) {
  if (!isObject(obj)) return;

  for (let key in obj) {
    if (!!key.match(nameRegex)) {
      delete obj[key];
    }

    if (Array.isArray(obj[key])) {
      let i = obj[key].length;
      while (i--) {
        if (typeof obj[key][i] === 'string' && !!obj[key][i].match(nameRegex)) {
          obj[key].splice(i, 1);
        }
      }
    }

    if (isObject(obj[key])) {
      stripObjectPropertiesByNameRegex(obj[key], nameRegex);
    }
  }
};

export {
  stripObjectPropertiesByNameRegex,
  isObject,
};
